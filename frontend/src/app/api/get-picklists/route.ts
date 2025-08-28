import { db } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending'; // Default to pending

        let query = `
            SELECT DISTINCT 
                pl.PICK_LIST_ID,
                pl.ORDER_NUMBER,
                pl.ORDER_DATE,
                pl.ASSIGNEE_ID,
                pl.REMARKS,
                CASE 
                    WHEN COUNT(CASE 
                        WHEN NOT (
                            COALESCE(pll.QUANTITY,0) = COALESCE(pll.PICKED_QTY,0) 
                            AND COALESCE(pll.QUANTITY,0) = COALESCE(pll.SHIPPED_QTY,0)
                            AND COALESCE(pll.SHIPPED_QTY,0) > 0
                            AND COALESCE(pll.HOLD_QTY,0) = 0
                        ) THEN 1
                        ELSE NULL
                    END) > 0 THEN 'pending'
                    ELSE 'completed'
                END as status
            FROM PICK_LIST pl
            LEFT JOIN PICK_LIST_LINES pll ON pl.PICK_LIST_ID = pll.PICK_LIST_ID
            GROUP BY pl.PICK_LIST_ID, pl.ORDER_NUMBER, pl.ORDER_DATE, pl.ASSIGNEE_ID, pl.REMARKS
        `;

        // Add status filter based on the requested status
        if (status === 'pending') {
            query += ` HAVING COUNT(CASE 
                WHEN NOT (
                    COALESCE(pll.QUANTITY,0) = COALESCE(pll.PICKED_QTY,0) 
                    AND COALESCE(pll.QUANTITY,0) = COALESCE(pll.SHIPPED_QTY,0)
                    AND COALESCE(pll.SHIPPED_QTY,0) > 0
                    AND COALESCE(pll.HOLD_QTY,0) = 0
                ) THEN 1
                ELSE NULL
            END) > 0`;
        } else if (status === 'completed') {
            query += ` HAVING COUNT(CASE 
                WHEN NOT (
                    COALESCE(pll.QUANTITY,0) = COALESCE(pll.PICKED_QTY,0) 
                    AND COALESCE(pll.QUANTITY,0) = COALESCE(pll.SHIPPED_QTY,0)
                    AND COALESCE(pll.SHIPPED_QTY,0) > 0
                    AND COALESCE(pll.HOLD_QTY,0) = 0
                ) THEN 1
                ELSE NULL
            END) = 0`;
        }
        // For 'all', no additional HAVING clause needed

        query += ` ORDER BY pl.ORDER_DATE DESC`;

        const picklists = await db.query(query);
        
        // Map the response to convert uppercase field names to lowercase to match frontend interface
        const mappedPicklists = (picklists || []).map((pick: any) => ({
            PICK_LIST_ID: pick.PICK_LIST_ID,
            ORDER_NUMBER: pick.ORDER_NUMBER,
            ORDER_DATE: pick.ORDER_DATE,
            ASSIGNEE_ID: pick.ASSIGNEE_ID,
            REMARKS: pick.REMARKS,
            status: pick.STATUS || pick.status // Handle both uppercase and lowercase
        }));
        
        return new Response(JSON.stringify(mappedPicklists), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching pick lists:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch pick lists' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}