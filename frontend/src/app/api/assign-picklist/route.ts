import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ENTITY_ID, PICK_LIST_ID } = body;
    console.log("Received body:", body);
    if (!ENTITY_ID || !PICK_LIST_ID) {
      return new Response(
        JSON.stringify({ error: "ENTITY_ID and PICK_LIST_ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const result = await db.query(
      `UPDATE PICK_LIST 
       SET PACKING_PERSON = :1 
       WHERE PICK_LIST_ID = :2`,
      [ENTITY_ID, PICK_LIST_ID],
       { autoCommit: true } 
    );
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("DB Error:", err);
    return new Response(JSON.stringify({ error: "Database query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
