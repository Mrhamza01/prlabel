import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const SHIPMENT_ID = request.nextUrl.searchParams.get('SHIPMENT_ID');

    if (!SHIPMENT_ID) {
      return new Response(
        JSON.stringify({ error: 'SHIPMENT_ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // First, check if the record exists
    const checkResult = (await db.query(
      `SELECT COUNT(*) as count FROM PICK_LIST_LINES WHERE SHIPMENT_ID = :shipment_id`,
      [SHIPMENT_ID]
    )) as any[];

    console.log('Check result:', checkResult);

    const recordCount =
      checkResult && checkResult.length > 0
        ? checkResult[0].COUNT || checkResult[0].count || 0
        : 0;

    if (recordCount === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No record found with the given SHIPMENT_ID',
          shipmentId: SHIPMENT_ID,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // // Perform the update
    // const updateResult = await db.query(
    //   `UPDATE PICK_LIST_LINES SET SHIPPED_QTY = QUANTITY
    //    WHERE SHIPMENT_ID = 'se-937940650'`,
    //   [{ autoCommit: true }]
    // );

    const updateResult = await db.query(
      `UPDATE PICK_LIST_LINES SET SHIPPED_QTY = QUANTITY
   WHERE SHIPMENT_ID = :shipment_id`,
      [SHIPMENT_ID], // params
      { autoCommit: true } // options
    );
    console.log('Update result:', updateResult);
    // Return a success response with meaningful data
    const response = {
      success: true,
      shipmentId: SHIPMENT_ID,
      message: 'Pick list line updated successfully',
      updatedAt: new Date().toISOString(),
      recordsFound: recordCount,
      updateResult: updateResult || 'Update completed',
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Database query failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
