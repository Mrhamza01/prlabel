import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pickListId = request.nextUrl.searchParams.get('PICK_LIST_ID');

    const result = await db.query(
      `SELECT 
    pll.PICK_LIST_ID,
    pll.PICK_LIST_LINES_ID,
    pll.SHIPMENT_ID,
    pll.SHIPPED_QTY,
    pll.QUANTITY,
    ss.SHIPMENT_NUMBER,
    ss.SERVICE_CODE,
    store.STORE_ID,
    store.STORE_NAME,
    sp.SKU AS PRODUCT_SKU,
    sp.NAME AS PRODUCT_NAME,
    sp.UPC
FROM 
    EVERHOMES.PICK_LIST_LINES pll
LEFT JOIN 
    EVERHOMES.SHIPSTATION_SHIPMENTS ss ON TO_CHAR(pll.SHIPMENT_ID) = ss.SHIPMENT_ID
LEFT JOIN 
    EVERHOMES.SHIPSTATION_STORES store ON ss.STORE_ID = 'se-' || store.STORE_ID
LEFT JOIN 
    EVERHOMES.SHIPSTATION_SHIPMENT_ITEMS ssi ON pll.CREATED_FROM_ID = ssi.ID
LEFT JOIN 
    (select sku ,MIN(NAME) name, MIN(UPC) upc from EVERHOMES.SHIPSTATION_PRODUCTS SP1
    group by sku) SP ON ssi.SKU = SP.sku
WHERE 
    pll.PICK_LIST_ID = :pickListId`,
      [pickListId]
    );
    console.log(result);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB Error:', err);
    return new Response(JSON.stringify({ error: 'Database query failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
