import { db } from '@/lib/db';
export async function GET() {
  const syncInfo = await db.query(
    "SELECT DATE_CHECK FROM ( SELECT * FROM shipstation_sync_log  WHERE sync_type = 'incremental' AND status = 'success' ORDER BY created_at DESC ) WHERE ROWNUM = 1"
  );
  console.log('syncInfo', syncInfo);
  return new Response(JSON.stringify(syncInfo), {
    headers: { 'Content-Type': 'application/json' },
  });
}
