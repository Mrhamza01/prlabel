import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending"; // Default to pending
    const entityId = searchParams.get("entityId");

    let query = `
            SELECT DISTINCT 
                PICK_LIST_ID,
                ORDER_NUMBER,
                ORDER_DATE,
                ASSIGNEE_ID,
                PACKING_PERSON,
                PACKING_PERSON_NAME,
                ASSIGNEE_NAME,
                REMARKS,
                status,
                shipped_order,
                total_Orders
            FROM pick_list_v
        `;

    // Add filter for entityId if provided
    if (entityId && entityId !== "null") {
      query += ` WHERE PACKING_PERSON = '${entityId}'`;
    }

    // // Add status filter based on the requested status
    if (status === "pending") {
      query += ` WHERE status = 'pending'`;
    } else if (status === "completed") {
      query += ` WHERE status = 'completed'`;
    }
    // For 'all', no additional HAVING clause needed

    const picklists = await db.query(query);
    // Map the response to convert uppercase field names to lowercase to match frontend interface
    const mappedPicklists = (picklists || []).map((pick: any) => ({
      PICK_LIST_ID: pick.PICK_LIST_ID,
      ORDER_NUMBER: pick.ORDER_NUMBER,
      ORDER_DATE: pick.ORDER_DATE,
      ASSIGNEE_ID: pick.ASSIGNEE_ID,
      PACKING_PERSON_NAME: pick.PACKING_PERSON_NAME,
      total_Orders: pick.TOTAL_ORDERS,
      shipped_order: pick.SHIPPED_ORDER,
      ASSIGNEE_NAME: pick.ASSIGNEE_NAME,
      REMARKS: pick.REMARKS,
      PACKING_PERSON: pick.PACKING_PERSON,
      status: pick.STATUS || pick.status, // Handle both uppercase and lowercase
    }));

    return new Response(JSON.stringify(mappedPicklists), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching pick lists:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch pick lists" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
