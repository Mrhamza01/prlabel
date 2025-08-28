/**
 * Database Connection Module for Oracle Database
 * 
 * This module provides a centralized interface for connecting to an Oracle database
 * using connection pooling for optimal performance and resource management.
 * It includes utilities for running queries, transactions, and managing connections.
 */

import oracledb from 'oracledb';

/**
 * Database configuration object
 * Uses environment variables for secure credential management
 */
const dbConfig = {
  user: process.env.DB_USER,                    // Database username from environment
  password: process.env.DB_PASSWORD,            // Database password from environment
  connectString: process.env.DB_CONNECT_STRING, // Database connection string (host:port/service)
  poolMin: 2,                                   // Minimum number of connections in pool
  poolMax: 10,                                  // Maximum number of connections in pool
  poolIncrement: 1,                             // Number of connections to add when pool grows
};

/**
 * Global connection pool instance
 * Manages multiple database connections for efficient resource usage
 */
let pool: oracledb.Pool | undefined;

/**
 * Initializes the Oracle database connection pool
 * 
 * Creates a connection pool if one doesn't exist. Connection pooling improves
 * performance by reusing existing connections instead of creating new ones
 * for each database operation.
 * 
 * @returns {Promise<oracledb.Pool>} The initialized connection pool
 * @throws {Error} If pool creation fails due to invalid credentials or connection issues
 * 
 * @example
 * // Initialize database connection pool on application startup
 * import { db } from '@/lib/db';
 * 
 * async function startApp() {
 *   try {
 *     await db.init();
 *     console.log('Database connected successfully');
 *     // Start your web server here
 *   } catch (error) {
 *     console.error('Failed to connect to database:', error);
 *     process.exit(1);
 *   }
 * }
 */
async function init() {
  if (!pool) {
    pool = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle connection pool started');
  }
  return pool;
}

/**
 * Gets a connection from the pool
 * 
 * Retrieves an available connection from the pool. If the pool hasn't been
 * initialized yet, it will automatically initialize it first.
 * 
 * @returns {Promise<oracledb.Connection>} A database connection from the pool
 * @throws {Error} If unable to get a connection from the pool
 */
async function getConnection() {
  if (!pool) {
    await init();
  }
  return await pool!.getConnection();
}

/**
 * Executes a SQL query and returns all matching rows
 * 
 * This is the primary method for running SELECT statements and other queries
 * that return data. It automatically manages connection acquisition and cleanup.
 * Results are returned as JavaScript objects for easy manipulation.
 * 
 * @param {string} sql - The SQL query to execute
 * @param {any[]} params - Array of bind parameters for the query (prevents SQL injection)
 * @param {any} options - Additional options for query execution
 * @returns {Promise<any[]>} Array of result rows as objects
 * @throws {Error} If query execution fails
 * 
 * @example
 * // Get all active users
 * const activeUsers = await db.query(
 *   'SELECT user_id, username, email, created_at FROM users WHERE status = :1', 
 *   ['active']
 * );
 * console.log(`Found ${activeUsers.length} active users`);
 * 
 * @example
 * // Get products by category with price range
 * const products = await db.query(`
 *   SELECT p.product_id, p.name, p.price, c.category_name 
 *   FROM products p 
 *   JOIN categories c ON p.category_id = c.category_id 
 *   WHERE p.price BETWEEN :1 AND :2 
 *   AND c.category_name = :3
 *   ORDER BY p.price ASC
 * `, [10.00, 100.00, 'Electronics']);
 * 
 * @example
 * // Get all records without parameters
 * const allOrders = await db.query('SELECT * FROM orders ORDER BY order_date DESC');
 */
// Run a query (default: all rows)
async function query(sql: string, params: any[] = [], options: any = {}) {
  let conn;
  try {
    // Get a connection from the pool
    conn = await getConnection();
    
    // Execute the query with parameters and return results as objects
    const result = await conn.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT, // Return rows as objects instead of arrays
      ...options,
    });
    
    return result.rows;
  } finally {
    // Always release the connection back to the pool
    if (conn) await conn.close();
  }
}

/**
 * Executes a SQL query and returns only the first matching row
 * 
 * Convenience method for queries where you expect only one result.
 * Automatically adds FETCH FIRST 1 ROWS ONLY to limit results and improve performance.
 * Returns null if no rows are found.
 * 
 * @param {string} sql - The SQL query to execute
 * @param {any[]} params - Array of bind parameters for the query
 * @param {any} options - Additional options for query execution
 * @returns {Promise<any|null>} Single result row as object, or null if no results
 * @throws {Error} If query execution fails
 * 
 * @example
 * // Get a specific user by ID
 * const user = await db.queryOne(
 *   'SELECT user_id, username, email, full_name FROM users WHERE user_id = :1', 
 *   [123]
 * );
 * if (user) {
 *   console.log(`Found user: ${user.username} (${user.email})`);
 * } else {
 *   console.log('User not found');
 * }
 * 
 * @example
 * // Get application configuration value
 * const config = await db.queryOne(
 *   'SELECT config_value FROM app_settings WHERE config_key = :1', 
 *   ['max_login_attempts']
 * );
 * const maxAttempts = config ? parseInt(config.config_value) : 3;
 * 
 * @example
 * // Check if email exists (returns row or null)
 * const existingUser = await db.queryOne(
 *   'SELECT user_id FROM users WHERE email = :1', 
 *   ['john@example.com']
 * );
 * const emailExists = existingUser !== null;
 */
// Run a single-row query
async function queryOne(sql: string, params: any[] = [], options: any = {}) {
  // Limit to 1 row for performance and append to the original query
  const rows = await query(sql + ' FETCH FIRST 1 ROWS ONLY', params, options);
  
  // Return the first row if it exists, otherwise null
  return rows && rows[0] ? rows[0] : null;
}

/**
 * Executes multiple database operations within a transaction
 * 
 * Provides ACID transaction support for operations that need to be atomic.
 * If any operation in the callback fails, all changes are rolled back.
 * If all operations succeed, changes are committed to the database.
 * 
 * @param {Function} callback - Function that receives a connection and performs database operations
 * @returns {Promise<any>} Result from the callback function
 * @throws {Error} If any operation in the transaction fails (triggers rollback)
 * 
 * @example
 * // Transfer money between accounts (atomic operation)
 * const transferResult = await db.transaction(async (conn) => {
 *   // Deduct from source account
 *   const debitResult = await conn.execute(
 *     'UPDATE accounts SET balance = balance - :1 WHERE account_id = :2 AND balance >= :1',
 *     [transferAmount, fromAccountId, transferAmount]
 *   );
 *   
 *   if (debitResult.rowsAffected === 0) {
 *     throw new Error('Insufficient funds or account not found');
 *   }
 *   
 *   // Add to destination account
 *   await conn.execute(
 *     'UPDATE accounts SET balance = balance + :1 WHERE account_id = :2',
 *     [transferAmount, toAccountId]
 *   );
 *   
 *   // Log the transaction
 *   const transactionId = generateTransactionId();
 *   await conn.execute(
 *     'INSERT INTO transaction_log (transaction_id, from_account, to_account, amount, timestamp) VALUES (:1, :2, :3, :4, SYSTIMESTAMP)',
 *     [transactionId, fromAccountId, toAccountId, transferAmount]
 *   );
 *   
 *   return { success: true, transactionId, amount: transferAmount };
 * });
 * 
 * @example
 * // Create order with order items (all or nothing)
 * const orderResult = await db.transaction(async (conn) => {
 *   // Create the main order
 *   const orderResult = await conn.execute(
 *     'INSERT INTO orders (order_id, customer_id, order_date, total_amount) VALUES (:1, :2, SYSTIMESTAMP, :3)',
 *     [orderId, customerId, totalAmount]
 *   );
 *   
 *   // Add each order item
 *   for (const item of orderItems) {
 *     await conn.execute(
 *       'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (:1, :2, :3, :4)',
 *       [orderId, item.productId, item.quantity, item.price]
 *     );
 *     
 *     // Update inventory
 *     await conn.execute(
 *       'UPDATE products SET stock_quantity = stock_quantity - :1 WHERE product_id = :2',
 *       [item.quantity, item.productId]
 *     );
 *   }
 *   
 *   return { orderId, itemCount: orderItems.length };
 * });
 * 
 * @example
 * // Simple transaction with error handling
 * try {
 *   const result = await db.transaction(async (conn) => {
 *     await conn.execute('INSERT INTO users (username, email) VALUES (:1, :2)', [username, email]);
 *     await conn.execute('INSERT INTO user_profiles (user_id, full_name) VALUES (user_seq.CURRVAL, :1)', [fullName]);
 *     return { success: true, message: 'User created successfully' };
 *   });
 *   console.log('Transaction completed:', result);
 * } catch (error) {
 *   console.error('Transaction failed and was rolled back:', error.message);
 * }
 */
// Transaction wrapper
async function transaction(
  callback: (conn: oracledb.Connection) => Promise<any>
) {
  let conn;
  try {
    // Get a dedicated connection for the transaction
    conn = await getConnection();
    
    // Execute the callback function with the connection
    const result = await callback(conn); // pass the connection so you can run multiple executes
    
    // If all operations succeed, commit the transaction
    await conn.commit();
    return result;
  } catch (err) {
    // If any operation fails, rollback all changes
    if (conn) await conn.rollback();
    throw err; // Re-throw the error for the caller to handle
  } finally {
    // Always release the connection back to the pool
    if (conn) await conn.close();
  }
}

/**
 * Closes the connection pool and cleans up resources
 * 
 * Should be called when the application is shutting down to properly
 * close all connections and free up database resources. The force parameter (0)
 * immediately closes all connections.
 * 
 * @returns {Promise<void>}
 * @throws {Error} If pool closure fails
 * 
 * @example
 * // Graceful shutdown on application termination
 * process.on('SIGTERM', async () => {
 *   console.log('Shutting down gracefully...');
 *   try {
 *     await db.close();
 *     console.log('Database connections closed');
 *   } catch (error) {
 *     console.error('Error closing database:', error);
 *   }
 *   process.exit(0);
 * });
 * 
 * @example
 * // Close connections in test cleanup
 * afterAll(async () => {
 *   await db.close();
 * });
 */
async function close() {
  if (pool) {
    await pool.close(0); // Force close all connections immediately
    pool = undefined;    // Reset pool reference
  }
}

/**
 * Database interface object
 * 
 * Exports all database functions in a single object for clean imports.
 * This provides a consistent API for database operations throughout the application.
 * 
 * @example
 * import { db } from '@/lib/db';
 * 
 * // Initialize connection pool
 * await db.init();
 * 
 * // Query data
 * const users = await db.query('SELECT * FROM users');
 * const user = await db.queryOne('SELECT * FROM users WHERE id = :1', [123]);
 * 
 * // Run transaction
 * await db.transaction(async (conn) => {
 *   // Multiple operations here
 * });
 * 
 * // Cleanup on shutdown
 * await db.close();
 */
export const db = {
  init,
  query,
  queryOne,
  transaction,
  close,
};

/**
 * Example usage and testing code (commented out)
 * 
 * This demonstrates how to use the database module:
 * 1. Initialize the connection pool
 * 2. Run a simple test query
 * 3. Clean up connections
 * 
 * Uncomment and modify for testing database connectivity.
 */
// const test = await db
//   .init()
//   .then(() => console.log('DB initialized'))
//   .then(() => console.log('DB initialization complete'))
//   .then(async () => {
//     await db.query('SELECT 1 FROM DUAL').then(result => {
//       console.log('Query result:', result);
//     });
//   })
//   .then(() => {
//     db.close().then(() => console.log('DB connection closed'));
//   });
