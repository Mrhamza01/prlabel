'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface SyncState {
  syncInfo: string | null;
  printerInfo: string | null;
  isSyncLoading: boolean;
  isPrinterLoading: boolean;
  hasError: boolean;
  hasPrinterError: boolean;
}

const LastSyncBanner = () => {
  const [state, setState] = useState<SyncState>({
    syncInfo: null,
    printerInfo: null,
    isSyncLoading: true,
    isPrinterLoading: true,
    hasError: false,
    hasPrinterError: false,
  });

  useEffect(() => {
    // Fetch Sync Info
    const fetchSyncInfo = async () => {
      try {
        const syncRes = await fetch('/api/get-sync-info', { cache: 'no-store' });
        if (!syncRes.ok) throw new Error('Sync API error');
        const syncData = await syncRes.json();
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
        setState(prev => ({
          ...prev,
          syncInfo: formattedSync,
          isSyncLoading: false,
          hasError: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isSyncLoading: false,
          hasError: true,
        }));
      }
    };

    // Fetch Printer Info
    const fetchPrinterInfo = async () => {
      try {
        const printerRes = await fetch('http://localhost:4000/printers/default', { cache: 'no-store' });
        if (!printerRes.ok) throw new Error('Printer API error');
        const printerData = await printerRes.json();
        setState(prev => ({
          ...prev,
          printerInfo: printerData?.defaultPrinter?.[0] || null,
          isPrinterLoading: false,
          hasPrinterError: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isPrinterLoading: false,
          hasPrinterError: true,
        }));
      }
    };

    fetchSyncInfo();
    fetchPrinterInfo();
  }, []);

  const { syncInfo, printerInfo, isSyncLoading, isPrinterLoading, hasError, hasPrinterError } = state;

  return (
    <div className="flex gap-2">
      {/* Printer Status */}
      {isPrinterLoading ? (
        <Badge variant="outline" className="text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading printer...
          </div>
        </Badge>
      ) : hasPrinterError ? (
        <Badge variant="destructive" className="text-xs font-medium">
          ⚠️ No printer
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs font-medium">
          🖨️ {printerInfo || 'Unknown'}
        </Badge>
      )}

      {/* Sync Status */}
      {isSyncLoading ? (
        <Badge variant="outline" className="text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading sync...
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
  );
};

export default LastSyncBanner;
