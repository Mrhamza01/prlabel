'use client';

import React, { useEffect, useRef, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Printer, ArrowLeft, Calendar, FileText, Package, AlertTriangle, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { usePickListStore } from '@/store/usePickListStore';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

const PickListLinesContent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pickListId = searchParams.get('PICK_LIST_ID');

  // State for managing expanded shipment groups
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());

  const {

    pickListLinesLoading,
    pickListLinesError,
    searchTerm,
    loadingShipmentId,
    checkedItems,
    isCheckingItem,
    fetchPickListLines,
    setSearchTerm,
    setMatchedUPC,
    executeSearch,
    handlePrint,
    handleManualPrint,
    clearSearch,
    getFilteredLines,
    getAllItemsCompleted,
    getCurrentPickList,
    setLoadingShipmentId,
    handleGroupPrint,
  } = usePickListStore();


  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
   
    useEffect(() => {
      if (!isAuthenticated) {
        router.replace("/login");
      }
    }, [isAuthenticated, router]);
  // fetch data
  useEffect(() => {
    if (!pickListId) return;
    fetchPickListLines(Number(pickListId));
  }, [pickListId, fetchPickListLines]);

  // Modified focus management - only refocus if no text is selected
  useEffect(() => {
    const keepFocus = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't refocus if user is trying to select text in table cells
      if (target.tagName === 'TD' || target.closest('td')) {
        return;
      }
      
      // Don't refocus if there's selected text anywhere
      if (window.getSelection()?.toString()) {
        return;
      }
      
      // Don't refocus if clicking on buttons or other interactive elements
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }
      
      inputRef.current?.focus();
    };
    
    // Add a small delay to allow for text selection
    const delayedFocus = (e: MouseEvent) => {
      setTimeout(() => keepFocus(e), 10);
    };
    
    window.addEventListener('click', delayedFocus);
    
    // Cleanup function
    return () => {
      window.removeEventListener('click', delayedFocus);
    };
  }, []);

  // Handle group print - update all lines but print only the main line
  const handleGroupPrintClick = async (shipmentId: string, lines: any[]) => {
    try {
      // Extract pick list line IDs from the lines
      const pickListLineIds = lines.map(line => parseInt(line.PICK_LIST_LINES_ID));
      
      // Use the store's group print function
      const success = await handleGroupPrint(shipmentId, pickListLineIds);
      
      if (success) {
        toast.success(`✅ Labels printed successfully for shipment ${shipmentId} (${lines.length} items)!`);
      } else {
        toast.error(`❌ Failed to print shipment ${shipmentId}`);
      }
    } catch (error) {
      console.error('Group print error:', error);
      toast.error('An error occurred while printing');
    }
  };

  const handlePrintClick = async (shipmentId: string, pickListLineId: string) => {
    const success = await handleManualPrint(shipmentId, parseInt(pickListLineId));
    if (success) {
      toast.info(`✅ Print request sent for shipment ${shipmentId}`);
    } else {
      toast.error(`❌ Failed to print shipment ${shipmentId}`);
    }
  };

  const handleGoBack = () => {
    router.push('/pick-lists');
  };

  // Get filtered lines from store
  const filteredLines = getFilteredLines();
  const allItemsCompleted = getAllItemsCompleted();
  const currentPickList = getCurrentPickList();

  // Calculate statistics
  const totalLines = filteredLines.length;
  const checkedCount = filteredLines.filter(line => checkedItems.has(line.PICK_LIST_LINES_ID)).length;
  const completedCount = filteredLines.filter(line => 
    line.SHIPPED_QTY !== null && 
    line.QUANTITY !== null && 
    line.SHIPPED_QTY === line.QUANTITY
  ).length;

  // Find duplicate shipment numbers
  const shipmentCounts = filteredLines.reduce((acc, line) => {
    acc[line.SHIPMENT_NUMBER] = (acc[line.SHIPMENT_NUMBER] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicateShipments = new Set(
    Object.entries(shipmentCounts)
      .filter(([shipment, count]) => count > 1)
      .map(([shipment]) => shipment)
  );

  // Group lines by shipment number
  const groupedLines = filteredLines.reduce((acc, line) => {
    const shipmentNumber = line.SHIPMENT_NUMBER;
    if (!acc[shipmentNumber]) {
      acc[shipmentNumber] = [];
    }
    acc[shipmentNumber].push(line);
    return acc;
  }, {} as Record<string, typeof filteredLines>);

  // Toggle expansion of a shipment group
  const toggleShipmentExpansion = (shipmentNumber: string) => {
    const newExpanded = new Set(expandedShipments);
    if (newExpanded.has(shipmentNumber)) {
      newExpanded.delete(shipmentNumber);
    } else {
      newExpanded.add(shipmentNumber);
    }
    setExpandedShipments(newExpanded);
  };

  // Handle input changes (typing) - only update display, don't execute search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear any existing timeout since we're not doing auto-search anymore
    if (typeof window !== 'undefined') {
      if ((window as any).searchTimeout) {
        clearTimeout((window as any).searchTimeout);
      }
    }
    
    // Clear matched UPC when user starts typing a new search
    if (value !== searchTerm) {
      setMatchedUPC(null);
    }
  };

  // Handle paste events - only update the input value, don't execute search
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Clear the input first, then process the pasted value
    const pastedValue = e.clipboardData.getData('text');
    
    // Small delay to ensure the paste operation completes
    setTimeout(() => {
      setSearchTerm(pastedValue);
      // Don't automatically execute search on paste - wait for Enter key
    }, 10);
  };

  // Handle key events (for barcode scanners that simulate typing)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Clear input on Escape
    if (e.key === 'Escape') {
      clearSearch();
    }
    
    // Execute search on Enter
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value;
      
      console.log('Enter search executing for:', value);
      await executeSearch(value);
      
      // Clear the search input after executing the search
      setSearchTerm('');
      setMatchedUPC(null);
    }
  };

  if (!pickListId) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pick Lists
          </Button>
        </div>
        <div className="text-center">
          ❌ No PICK_LIST_ID provided in URL
        </div>
      </div>
    );
  }

  // Show loading state
  if (pickListLinesLoading) {
    return (
      <div className="p-6 max-w-full">
        {/* Breadcrumb and back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pick Lists
          </Button>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span 
              onClick={handleGoBack}
              className="hover:text-blue-600 cursor-pointer"
            >
              Pick Lists
            </span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Pick List Lines (ID: {pickListId})</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-center">
          🚚 Dispatch System – Pick List Details
        </h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading pick list lines...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (pickListLinesError) {
    return (
      <div className="p-6 max-w-full">
        {/* Breadcrumb and back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pick Lists
          </Button>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span 
              onClick={handleGoBack}
              className="hover:text-blue-600 cursor-pointer"
            >
              Pick Lists
            </span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Pick List Lines (ID: {pickListId})</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-center">
          🚚 Dispatch System – Pick List Details
        </h1>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">
            Error loading pick list lines: {pickListLinesError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      {/* Breadcrumb and back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          onClick={handleGoBack}
          variant="outline"
          className="flex items-center gap-2 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pick Lists
        </Button>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span 
            onClick={handleGoBack}
            className="hover:text-blue-600 cursor-pointer"
          >
            Pick Lists
          </span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Pick List Lines (ID: {pickListId})</span>
        </div>
      </div>
      
      {/* Main title */}
      <h1 className="text-3xl font-bold mb-6 text-center">
        🚚 Dispatch System – Pick List Details
      </h1>

      {/* Pick List Info Card - Compact */}
      {currentPickList && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              {/* Order Info */}
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-600" />
                <span className="text-gray-600">Order:</span>
                <span className="font-medium">{currentPickList.ORDER_NUMBER}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span className="font-medium">
                  {new Date(currentPickList.ORDER_DATE).toLocaleDateString()}
                </span>
              </div>
              
              {/* Separator */}
              <div className="hidden md:block w-px h-4 bg-gray-300"></div>
              
              {/* Statistics */}
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3 text-green-600" />
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{totalLines}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-gray-600">Checked:</span>
                <span className="font-medium">{checkedCount}/{totalLines}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium">{completedCount}/{totalLines}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-600" />
                <span className="text-gray-600">Bulk Orders:</span>
                <span className="font-medium">{duplicateShipments.size}</span>
              </div>
              
              {/* Remarks if present */}
              {currentPickList.REMARKS && (
                <>
                  <div className="hidden md:block w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="text-gray-600">Note:</span>
                    <span className="font-medium truncate max-w-32">{currentPickList.REMARKS}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔍 Search Bar */}
      <div className="flex justify-center mb-6">
        <div className="w-full md:w-1/2 relative">
          <Input
            ref={inputRef}
            placeholder="🔍 Scan or type UPC... (Press Enter to search & clear)"
            value={searchTerm}
            onChange={handleInputChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="w-full p-4 text-lg"
            autoFocus
            disabled={isCheckingItem}
          />
          {searchTerm && (
            <button
              onClick={() => {
                clearSearch();
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={isCheckingItem}
            >
              ✕
            </button>
          )}
          {isCheckingItem && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {/* Helper text */}
          <div className="text-center text-sm text-gray-500 mt-2">
            Type or paste UPC, then press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to execute search and clear input
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isCheckingItem && (
        <div className="flex justify-center mb-4">
          <div className="text-blue-600 font-medium">
            🔄 Updating shipment...
          </div>
        </div>
      )}

      {/* No data to print message */}
      {allItemsCompleted && (
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            ✅ All items completed! No data to print.
          </div>
        </div>
      )}

      {/* Duplicate shipments warning */}
      {duplicateShipments.size > 0 && (
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {duplicateShipments.size} shipment number(s) have Bulk Order - scanning/updates blocked (printing still allowed)
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-12 text-center">Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
              <TableHead>SHIPMENT_NUMBER</TableHead>
              <TableHead>SERVICE_CODE</TableHead>
              <TableHead>STORE_NAME</TableHead>
              <TableHead>PRODUCT_SKU</TableHead>
              <TableHead>PRODUCT_NAME</TableHead>
              <TableHead>UPC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(groupedLines).length > 0 ? (
              Object.entries(groupedLines).map(([shipmentNumber, lines]) => {
                const isExpanded = expandedShipments.has(shipmentNumber);
                const hasMultipleLines = lines.length > 1;
                const hasDuplicateShipment = duplicateShipments.has(shipmentNumber);
                
                // For the summary row, use the first line's data
                const summaryLine = lines[0];
                const summaryChecked = lines.some(line => checkedItems.has(line.PICK_LIST_LINES_ID));
                const allLinesChecked = lines.every(line => checkedItems.has(line.PICK_LIST_LINES_ID));
                
                return (
                  <React.Fragment key={shipmentNumber}>
                    {/* Summary/Group Row */}
                    <TableRow
                      className={`${summaryChecked ? 'bg-green-50' : ''} ${hasDuplicateShipment ? 'bg-orange-50 border-l-4 border-orange-400' : ''} ${hasMultipleLines ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={hasMultipleLines ? () => toggleShipmentExpansion(shipmentNumber) : undefined}
                    >
                      {/* Status */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {allLinesChecked ? (
                            <CheckCircle className="text-green-600 w-6 h-6" />
                          ) : summaryChecked ? (
                            <CheckCircle className="text-yellow-600 w-6 h-6" />
                          ) : (
                            <XCircle className="text-gray-400 w-6 h-6" />
                          )}
                          {hasDuplicateShipment && (
                            <AlertTriangle className="text-orange-500 w-4 h-4" />
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGroupPrintClick(summaryLine.SHIPMENT_ID, lines);
                            }}
                            disabled={loadingShipmentId === summaryLine.SHIPMENT_ID}
                            variant={summaryChecked ? 'default' : 'secondary'}
                            className="flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            {loadingShipmentId === summaryLine.SHIPMENT_ID
                              ? 'Printing...'
                              : 'Print'}
                          </Button>
                          {hasMultipleLines && (
                            <div className="text-xs text-gray-500">
                              ({lines.length} items)
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Shipment Number with expand/collapse icon */}
                      <TableCell className="select-text cursor-text">
                        <div className="flex items-center gap-2">
                          {hasMultipleLines && (
                            isExpanded ? 
                              <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span>{shipmentNumber}</span>
                          {hasDuplicateShipment && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                              <Copy className="w-3 h-3 mr-1" />
                              Bulk Order ({lines.length})
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Other columns - show summary info */}
                      <TableCell className="select-text cursor-text">
                        {summaryLine.SERVICE_CODE ?? '-'}
                      </TableCell>
                      <TableCell className="select-text cursor-text">
                        {summaryLine.STORE_NAME ?? '-'}
                      </TableCell>
                      <TableCell className="select-text cursor-text">
                        {hasMultipleLines ? `${lines.length} products` : (summaryLine.PRODUCT_SKU ?? '-')}
                      </TableCell>
                      <TableCell className="select-text cursor-text">
                        {hasMultipleLines ? 'Multiple products' : (summaryLine.PRODUCT_NAME ?? '-')}
                      </TableCell>
                      <TableCell className="font-mono select-text cursor-text">
                        {hasMultipleLines ? 'Multiple UPCs' : (summaryLine.UPC ?? '-')}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Detail Rows */}
                    {hasMultipleLines && isExpanded && lines.map((line, idx) => {
                      const isChecked = checkedItems.has(line.PICK_LIST_LINES_ID);
                      return (
                        <TableRow
                          key={`${shipmentNumber}-${idx}`}
                          className={`${isChecked ? 'bg-green-50' : ''} bg-gray-25 border-l-2 border-gray-300 ml-4`}
                        >
                          {/* Status */}
                          <TableCell className="text-center pl-8">
                            {isChecked ? (
                              <CheckCircle className="text-green-600 w-5 h-5 mx-auto" />
                            ) : (
                              <XCircle className="text-gray-400 w-5 h-5 mx-auto" />
                            )}
                          </TableCell>

                          {/* Actions - No print button for sub-rows */}
                          <TableCell className="pl-8">
                            <div className="text-xs text-gray-500 italic">
                              {isChecked ? 'Completed' : 'Pending'}
                            </div>
                          </TableCell>

                          {/* Detail columns */}
                          <TableCell className="select-text cursor-text pl-8 text-sm text-gray-600">
                            {line.SHIPMENT_NUMBER}
                          </TableCell>
                          <TableCell className="select-text cursor-text text-sm">
                            {line.SERVICE_CODE ?? '-'}
                          </TableCell>
                          <TableCell className="select-text cursor-text text-sm">
                            {line.STORE_NAME ?? '-'}
                          </TableCell>
                          <TableCell className="select-text cursor-text text-sm">
                            {line.PRODUCT_SKU ?? '-'}
                          </TableCell>
                          <TableCell className="select-text cursor-text text-sm">
                            {line.PRODUCT_NAME ?? '-'}
                          </TableCell>
                          <TableCell className="font-mono select-text cursor-text text-sm">
                            {line.UPC ?? '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  ❌ No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Legend:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-600 w-4 h-4" />
            <span>Item checked/completed</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="text-gray-400 w-4 h-4" />
            <span>Item not checked</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500 w-4 h-4" />
            <span>Duplicate shipment number - scanning/updates blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
              <Copy className="w-3 h-3 mr-1" />
              Duplicate
            </Badge>
            <span>Indicates duplicate shipment (printing allowed)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PickListLinesPage = () => {
  return (
    <Suspense fallback={<div className="p-6">Loading pick list lines...</div>}>
      <PickListLinesContent />
    </Suspense>
  );
};

export default PickListLinesPage;