import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
console.log('Login attempt', { username, password });
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Query the view with case-sensitive comparison for password
    // and uppercase comparison for username
    const result = await db.query(
      `SELECT ENTITY_ID, LOGIN_USER_NAME, ENTITY_TYPE
       FROM ENTITY_LOGINS_LIST_V 
       WHERE UPPER(LOGIN_USER_NAME) = UPPER(:username)
       AND LOGIN_PASSWORD = :password
       AND LOGINACCESS = 'Y'`,
      [username, password]
    );
console.log('Login query result:', result);
    if (result && result.length > 0) {
      // User found, return success with user data
      const userData = {
        entity_id: (result[0] as any).ENTITY_ID,
        username: (result[0] as any).LOGIN_USER_NAME,
        entity_type: (result[0] as any).ENTITY_TYPE
      };

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Login successful',
          user: userData 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      // No user found with those credentials
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid username or password' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'An error occurred during login' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  const syncInfo = await db.query(
    "SELECT DATE_CHECK FROM ( SELECT * FROM shipstation_sync_log  WHERE sync_type = 'incremental' AND status = 'success' ORDER BY created_at DESC ) WHERE ROWNUM = 1"
  );
  console.log('syncInfo', syncInfo);
  return new Response(JSON.stringify(syncInfo), {
    headers: { 'Content-Type': 'application/json' },
  });
}
