'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface SyncState {
  syncInfo: string | null;
  printerInfo: string | null;
  isLoading: boolean;
  hasError: boolean;
  hasPrinterError: boolean;
}

const LastSyncBanner = () => {
  const [state, setState] = useState<SyncState>({
    syncInfo: null,
    printerInfo: null,
    isLoading: true,
    hasError: false,
    hasPrinterError: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [syncRes, printerRes] = await Promise.all([
          fetch('/api/get-sync-info', { cache: 'no-store' }),
          fetch('http://localhost:4000/printers/default', {
            cache: 'no-store',
          }),
        ]);

        const syncData = syncRes.ok ? await syncRes.json() : null;
        const printerData = printerRes.ok ? await printerRes.json() : null;

        const formattedSync = syncData?.[0]?.DATE_CHECK
          ? new Date(syncData[0].DATE_CHECK).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            })
          : null;

        setState({
          syncInfo: formattedSync,
          printerInfo: printerData?.[0]?.NAME || null,
          isLoading: false,
          hasError: !syncRes.ok,
          hasPrinterError: !printerRes.ok,
        });
      } catch (error) {
        console.error('Fetch error:', error);
        setState(prev => ({ ...prev, isLoading: false, hasError: true }));
      }
    };

    fetchData();
  }, []);

  const { syncInfo, printerInfo, isLoading, hasError, hasPrinterError } = state;

  return (
    <div className="fixed top-4 right-4 z-100">
      <div className="flex flex-col items-end gap-2">
        {/* Printer Status */}
        <Badge
          variant={hasPrinterError ? 'destructive' : 'secondary'}
          className="text-xs font-medium"
        >
          {hasPrinterError ? '⚠️ No printer' : `🖨️ ${printerInfo || 'Unknown'}`}
        </Badge>

        {/* Sync Status */}
        {isLoading ? (
          <Badge variant="outline" className="text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          </Badge>
        ) : hasError ? (
          <Badge variant="destructive" className="text-xs font-medium">
            ⚠️ Sync error
          </Badge>
        ) : syncInfo ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">
              Last sync:
            </span>
            <Badge variant="secondary" className="text-xs font-medium">
              📅 {syncInfo}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs">
            No sync data
          </Badge>
        )}
      </div>
    </div>
  );
};

export default LastSyncBanner;
