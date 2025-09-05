import { GLOBAL_ENTITY_ID } from "@/lib/constant";
import { toast } from "sonner";
import { create } from "zustand";

// Types
interface PickList {
  PICK_LIST_ID: number;
  ORDER_NUMBER: string;
  ORDER_DATE: string;
  ASSIGNEE_ID: number | null;
  ASSIGNEE_NAME: string | null;
  PACKING_PERSON_NAME: string | null;
  shipped_order: number | null;
  total_Orders: number | null;
  REMARKS: string | null;
  status: "pending" | "completed";
  PACKING_PERSON: string | null;
}

interface PickListLine {
  PICK_LIST_ID: number;
  PICK_LIST_LINES_ID: number;
  SHIPMENT_ID: string;
  SHIPMENT_NUMBER: string;
  SERVICE_CODE: string | null;
  SHIPMENT_STATUS: string | null;
  STORE_ID: number | null;
  STORE_NAME: string | null;
  PRODUCT_SKU: string | null;
  PRODUCT_NAME: string | null;
  UPC: string | null;
  SHIPPED_QTY: number | null;
  QUANTITY: number | null;
}

interface PickListStore {
  // State
  pickLists: PickList[];
  pickListsLoading: boolean;
  pickListsError: string | null;
  allPickListsStats: {
    pending: number;
    completed: number;
    total: number;
  } | null; // For stats display

  pickListLines: PickListLine[];
  pickListLinesLoading: boolean;
  pickListLinesError: string | null;
  currentPickListId: number | null;

  // Search State
  searchTerm: string;
  matchedUPC: string | null;
  checkedItems: Set<number>; // Track checked PICK_LIST_LINES_ID
  currentCheckIndex: number;
  lastSearchTerm: string; // Track the last completed search
  isCheckingItem: boolean; // Track if we're currently making an API call to check an item
  lastApiCall: string | null; // Track the last API call to prevent duplicates

  // Print State
  loadingShipmentId: string | null;
  printedShipments: Set<string>; // Track which shipments have already been printed

  // Actions
  fetchPickLists: (status?: string, entityId?: Number | null) => Promise<void>;
  fetchPickListsStats: () => Promise<void>;
  fetchPickListLines: (pickListId: number) => Promise<void>;
  setSearchTerm: (term: string) => void;
  executeSearch: (term: string) => Promise<void>; // New action for when search is "executed"
  setMatchedUPC: (upc: string | null) => void;
  // handlePrint: (shipmentId: string) => Promise<boolean>;
  // handleManualPrint: (
  //   shipmentId: string,
  //   pickListLinesId: number
  // ) => Promise<boolean>; // Manual print with conditional update
  clearPickListLines: () => void;
  clearSearch: () => void;
  checkNextItem: (upc: string) => Promise<void>;
  setPackingPerson: (
    picklistid: Number,
    packingPerson: string | null,
    packingPersonName?: string | null
  ) => void;
  resetPickList: () => void;
  // Computed properties
  getFilteredLines: () => PickListLine[];
  getCurrentCheckedItem: () => PickListLine | null;
  getAllItemsCompleted: () => boolean; // Check if all items have SHIPPED_QTY === QUANTITY
  getCurrentPickList: () => PickList | null; // Get current pick list details
  setLoadingShipmentId: (shipmentId: string | null) => void; // Set loading state
  handleGroupPrint: (
    shipmentId: string,
    pickListLineIds: number[],
    labelprinted: boolean
  ) => Promise<boolean>; // Group print with update all lines
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const PRINTER_BASE_URL =
  process.env.NEXT_PUBLIC_PRINTER_BASE_URL || "http://localhost:4000";

export const usePickListStore = create<PickListStore>((set, get) => ({
  // Initial State
  pickLists: [],
  pickListsLoading: false,
  pickListsError: null,
  allPickListsStats: null,
  pickListLines: [],
  pickListLinesLoading: false,
  pickListLinesError: null,
  currentPickListId: null,
  PACKING_PERSON: null,
  searchTerm: "",
  matchedUPC: null,
  checkedItems: new Set(),
  currentCheckIndex: 0,
  lastSearchTerm: "",
  isCheckingItem: false,
  lastApiCall: null,

  loadingShipmentId: null,
  printedShipments: new Set(),

  // Actions
  fetchPickLists: async (
    status: string = "pending",
    entityId?: Number | null
  ) => {
    set({ pickListsLoading: true, pickListsError: null });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-picklists?status=${status}&entityId=${entityId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pick lists: ${response.statusText}`);
      }

      const data: PickList[] = await response.json();
      set({
        pickLists: data,
        pickListsLoading: false,
        pickListsError: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch pick lists";
      console.error("Error fetching pick lists:", error);
      set({
        pickListsLoading: false,
        pickListsError: errorMessage,
        pickLists: [],
      });
    }
  },

  fetchPickListsStats: async () => {
    try {
      // Fetch stats by getting counts for each status
      const [pendingResponse, completedResponse, allResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/get-picklists?status=pending`),
          fetch(`${API_BASE_URL}/api/get-picklists?status=completed`),
          fetch(`${API_BASE_URL}/api/get-picklists?status=all`),
        ]);

      const [pendingData, completedData, allData] = await Promise.all([
        pendingResponse.json(),
        completedResponse.json(),
        allResponse.json(),
      ]);

      set({
        allPickListsStats: {
          pending: pendingData.length,
          completed: completedData.length,
          total: allData.length,
        },
      });
    } catch (error) {
      console.error("Error fetching pick lists stats:", error);
    }
  },

  fetchPickListLines: async (pickListId: number) => {
    set({
      pickListLinesLoading: true,
      pickListLinesError: null,
      currentPickListId: pickListId,
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get-picklist-lines?PICK_LIST_ID=${pickListId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pick list lines: ${response.statusText}`
        );
      }

      const data: PickListLine[] = await response.json();

      // Auto-check rows where SHIPPED_QTY equals QUANTITY
      const autoCheckedItems = new Set<number>();
      data.forEach((line: PickListLine) => {
        if (
          line.SHIPPED_QTY !== null &&
          line.QUANTITY !== null &&
          line.SHIPPED_QTY === line.QUANTITY
        ) {
          autoCheckedItems.add(line.PICK_LIST_LINES_ID);
        }
      });

      set({
        pickListLines: data,
        pickListLinesLoading: false,
        pickListLinesError: null,
        checkedItems: autoCheckedItems,
      });

      console.log("Pick list lines fetched successfully", {
        total: data.length,
        autoChecked: autoCheckedItems.size,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch pick list lines";
      console.error("Error fetching pick list lines:", error);
      set({
        pickListLinesLoading: false,
        pickListLinesError: errorMessage,
        pickListLines: [],
        checkedItems: new Set(),
      });
    }
  },

  setSearchTerm: (term: string) => {
    const trimmedTerm = term.trim();
    set({ searchTerm: trimmedTerm });
    // Don't automatically execute search, just update the display
  },

  executeSearch: async (term: string) => {
    const trimmedTerm = term.trim();
    const { lastSearchTerm, isCheckingItem } = get();

    if (!trimmedTerm) {
      set({ matchedUPC: null });
      return;
    }

    // Prevent multiple simultaneous searches
    if (isCheckingItem) {
      console.log("Search already in progress, ignoring duplicate call");
      return;
    }

    console.log(
      "Executing search for:",
      trimmedTerm,
      "Last search:",
      lastSearchTerm
    );

    // Always execute checkNextItem - whether it's new or repeat search
    set({ lastSearchTerm: trimmedTerm });
    await get().checkNextItem(trimmedTerm);
  },

  checkNextItem: async (upc: string) => {
    const { pickListLines, checkedItems, printedShipments } = get();

    console.log("=== checkNextItem START ===");
    console.log("checkNextItem called with UPC:", upc);
    console.log("Current checked items:", Array.from(checkedItems));
    console.log("Current printed shipments:", Array.from(printedShipments));

    // Set loading state
    set({ isCheckingItem: true });

    try {
      // Find all matching lines for this UPC (exact match only)
      const matchingLines = pickListLines.filter(
        (line) => line.UPC?.toLowerCase() === upc.toLowerCase()
      );

      console.log("Matching lines found:", matchingLines.length);

      if (matchingLines.length === 0) {
        set({ matchedUPC: null, isCheckingItem: false });
        return;
      }

      // Find the FIRST unchecked item with this UPC
      const nextUnchecked = matchingLines.find(
        (line) => !checkedItems.has(line.PICK_LIST_LINES_ID)
      );

      console.log("Next unchecked item:", nextUnchecked?.PICK_LIST_LINES_ID);

      if (nextUnchecked) {
        // Check for duplicate SHIPMENT_NUMBERs
        const shipmentCounts = pickListLines.reduce((acc, line) => {
          acc[line.SHIPMENT_NUMBER] = (acc[line.SHIPMENT_NUMBER] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const hasDuplicateShipment =
          shipmentCounts[nextUnchecked.SHIPMENT_NUMBER] > 1;

        if (hasDuplicateShipment) {
          console.log(
            "Skipping operation: Duplicate SHIPMENT_NUMBER detected:",
            nextUnchecked.SHIPMENT_NUMBER
          );
          set({
            matchedUPC: nextUnchecked.UPC,
            isCheckingItem: false,
          });
          // Show alert to user about duplicate shipment
          toast.warning(
            `⚠️ Cannot scan/update: Multiple items found with shipment number ${nextUnchecked.SHIPMENT_NUMBER}. Printing is still allowed.`
          );
          return;
        }

        // Condition 1: Skip operation if SHIPPED_QTY equals QUANTITY and item is already checked
        if (
          nextUnchecked.SHIPPED_QTY !== null &&
          nextUnchecked.QUANTITY !== null &&
          nextUnchecked.SHIPPED_QTY === nextUnchecked.QUANTITY &&
          checkedItems.has(nextUnchecked.PICK_LIST_LINES_ID)
        ) {
          console.log("Skipping operation: Item already completed and checked");
          set({
            matchedUPC: nextUnchecked.UPC,
            isCheckingItem: false,
          });
          return;
        }

        const apiCallKey = `${nextUnchecked.SHIPMENT_ID}-${Date.now()}`;

        // Prevent duplicate API calls for the same shipment
        if (get().lastApiCall === nextUnchecked.SHIPMENT_ID) {
          console.log(
            "Duplicate API call prevented for SHIPMENT_ID:",
            nextUnchecked.SHIPMENT_ID
          );
          set({ isCheckingItem: false });
          return;
        }

        // Call the API to update the picklist line before marking as checked
        console.log(
          "Calling API to update SHIPMENT_ID:",
          nextUnchecked.SHIPMENT_ID
        );
        set({ lastApiCall: nextUnchecked.SHIPMENT_ID });

        const response = await fetch(
          `${API_BASE_URL}/api/update-picklist-lines?SHIPMENT_ID=${nextUnchecked.SHIPMENT_ID}`
        );

        if (!response.ok) {
          throw new Error(
            `API call failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log("API response:", result);

        // Check if the API response indicates success
        if (result.success === false) {
          throw new Error(result.error || "API returned failure status");
        }

        // Determine if we should print (before state updates)
        const shouldPrint = !printedShipments.has(nextUnchecked.SHIPMENT_ID);
        const shipmentToPrint = shouldPrint ? nextUnchecked.SHIPMENT_ID : null;

        // API call successful - now mark the item as checked
        const newCheckedItems = new Set<number>(checkedItems);
        newCheckedItems.add(nextUnchecked.PICK_LIST_LINES_ID);

        console.log(
          "Adding to checked items:",
          nextUnchecked.PICK_LIST_LINES_ID
        );
        console.log("New checked items will be:", Array.from(newCheckedItems));

        // Update printed shipments if we're going to print
        const newPrintedShipments = shouldPrint
          ? new Set([...printedShipments, nextUnchecked.SHIPMENT_ID])
          : printedShipments;

        set({
          checkedItems: newCheckedItems,
          matchedUPC: nextUnchecked.UPC,
          isCheckingItem: false,
          lastApiCall: null, // Reset after successful completion
          printedShipments: newPrintedShipments,
        });

        // Handle printing after state updates
        if (shipmentToPrint) {
          console.log("Triggering print for SHIPMENT_ID:", shipmentToPrint);
          const printSuccess = await get().handleGroupPrint(shipmentToPrint, [nextUnchecked.PICK_LIST_LINES_ID], false);
          if (printSuccess) {
            console.log(
              "Print job sent successfully for SHIPMENT_ID:",
              shipmentToPrint
            );
          } else {
            console.error("Print job failed for SHIPMENT_ID:", shipmentToPrint);
            // Remove from printed shipments if print failed
            const currentState = get();
            const updatedPrintedShipments = new Set(
              currentState.printedShipments
            );
            updatedPrintedShipments.delete(shipmentToPrint);
            set({ printedShipments: updatedPrintedShipments });
          }
        } else {
          console.log(
            "Shipment already printed, skipping print for SHIPMENT_ID:",
            nextUnchecked.SHIPMENT_ID
          );
        }
      } else {
        // All items with this UPC are already checked
        console.log("All items with this UPC are already checked");

        // Check if ALL matching lines are already checked
        const allChecked = matchingLines.every((line) =>
          checkedItems.has(line.PICK_LIST_LINES_ID)
        );

        if (allChecked) {
          console.log("All UPC items are completed - showing error message");
          set({
            matchedUPC: upc,
            isCheckingItem: false,
          });
          toast.error(`❌ All items with UPC ${upc} are already completed!`);
          return;
        }

        // If we reach here, something went wrong - fallback to first line
        const firstLine = matchingLines[0];

        // Check for duplicate SHIPMENT_NUMBERs
        const shipmentCounts = pickListLines.reduce((acc, line) => {
          acc[line.SHIPMENT_NUMBER] = (acc[line.SHIPMENT_NUMBER] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const hasDuplicateShipment =
          shipmentCounts[firstLine.SHIPMENT_NUMBER] > 1;

        if (hasDuplicateShipment) {
          console.log(
            "Skipping reset operation: Duplicate SHIPMENT_NUMBER detected:",
            firstLine.SHIPMENT_NUMBER
          );
          set({
            matchedUPC: firstLine.UPC,
            isCheckingItem: false,
          });
          // Show alert to user about duplicate shipment
          toast.warning(
            `⚠️ Cannot scan/update: Multiple items found with shipment number ${firstLine.SHIPMENT_NUMBER}. Printing is still allowed.`
          );
          return;
        }

        // Condition 1: Skip operation if SHIPPED_QTY equals QUANTITY and item is already checked
        if (
          firstLine.SHIPPED_QTY !== null &&
          firstLine.QUANTITY !== null &&
          firstLine.SHIPPED_QTY === firstLine.QUANTITY &&
          checkedItems.has(firstLine.PICK_LIST_LINES_ID)
        ) {
          console.log(
            "Skipping reset operation: Item already completed and checked"
          );
          set({
            matchedUPC: firstLine.UPC,
            isCheckingItem: false,
          });
          return;
        }

        // Prevent duplicate API calls for the same shipment
        if (get().lastApiCall === firstLine.SHIPMENT_ID) {
          console.log(
            "Duplicate API call prevented for SHIPMENT_ID (reset):",
            firstLine.SHIPMENT_ID
          );
          set({ isCheckingItem: false });
          return;
        }

        console.log(
          "All checked, resetting. Calling API for SHIPMENT_ID:",
          firstLine.SHIPMENT_ID
        );
        set({ lastApiCall: firstLine.SHIPMENT_ID });

        const response = await fetch(
          `${API_BASE_URL}/api/update-picklist-lines?SHIPMENT_ID=${firstLine.SHIPMENT_ID}`
        );

        if (!response.ok) {
          throw new Error(
            `API call failed: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log("API response for reset:", result);

        // Check if the API response indicates success
        if (result.success === false) {
          throw new Error(result.error || "API returned failure status");
        }

        // Determine if we should print (before state updates)
        const shouldPrint = !printedShipments.has(firstLine.SHIPMENT_ID);
        const shipmentToPrint = shouldPrint ? firstLine.SHIPMENT_ID : null;

        // API call successful - reset and mark first item
        const newCheckedItems = new Set<number>();
        newCheckedItems.add(firstLine.PICK_LIST_LINES_ID);

        console.log(
          "All checked, resetting. New checked item:",
          firstLine.PICK_LIST_LINES_ID
        );

        // Update printed shipments if we're going to print
        const newPrintedShipments = shouldPrint
          ? new Set([...printedShipments, firstLine.SHIPMENT_ID])
          : printedShipments;

        set({
          checkedItems: newCheckedItems,
          matchedUPC: firstLine.UPC,
          isCheckingItem: false,
          lastApiCall: null, // Reset after successful completion
          printedShipments: newPrintedShipments,
        });

        // Handle printing after state updates
        if (shipmentToPrint) {
          console.log(
            "Triggering print for SHIPMENT_ID (reset):",
            shipmentToPrint
          );
          const printSuccess = await get().handleGroupPrint(shipmentToPrint, [firstLine.PICK_LIST_LINES_ID], true);
          if (printSuccess) {
            console.log(
              "Print job sent successfully for SHIPMENT_ID (reset):",
              shipmentToPrint
            );
          } else {
            console.error(
              "Print job failed for SHIPMENT_ID (reset):",
              shipmentToPrint
            );
            // Remove from printed shipments if print failed
            const currentState = get();
            const updatedPrintedShipments = new Set(
              currentState.printedShipments
            );
            updatedPrintedShipments.delete(shipmentToPrint);
            set({ printedShipments: updatedPrintedShipments });
          }
        } else {
          console.log(
            "Shipment already printed, skipping print for SHIPMENT_ID (reset):",
            firstLine.SHIPMENT_ID
          );
        }
      }
    } catch (error) {
      console.error("Failed to update picklist line:", error);
      // Don't mark the item as checked if API call fails
      set({
        isCheckingItem: false,
        lastApiCall: null, // Reset on error
      });
      toast.error(
        `❌ Failed to update shipment: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    console.log("=== checkNextItem END ===");
  },
  setPackingPerson: async (
    picklistid: Number,
    packingPerson: string | null,
    packingPersonName: string | null = null
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assign-picklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ENTITY_ID: packingPerson,
          PICK_LIST_ID: picklistid,
        }),
      });

      if (!response.ok) {
        throw new Error(`Print request failed: ${response}`);
      }

      set((state) => {
        // Update both pickLists and pickListLines
        const updatedPickLists = state.pickLists.map((pick) =>
          pick.PICK_LIST_ID === picklistid
            ? {
                ...pick,
                PACKING_PERSON: packingPerson,
                PACKING_PERSON_NAME: packingPersonName,
              }
            : pick
        );
        const updatedPickListLines = state.pickListLines.map((line) =>
          line.PICK_LIST_ID === picklistid
            ? {
                ...line,
                PACKING_PERSON: packingPerson,
                PACKING_PERSON_NAME: packingPersonName,
              }
            : line
        );
        toast.success("Pick list assigned successfully");
        return {
          pickLists: updatedPickLists,
          pickListLines: updatedPickListLines,
        };
      });
    } catch (error) {
      console.error("Print error:", error);
    }
  },
  resetPickList: () => {
    set({
      pickLists: [],
      currentPickListId: null,
      pickListLines: [],
      getFilteredLines: () => [] as PickListLine[],
      getCurrentCheckedItem: () => null as PickListLine | null,
      getAllItemsCompleted: () => false,
      getCurrentPickList: () => null as PickList | null,
    });
  },
  setMatchedUPC: (upc: string | null) => {
    set({ matchedUPC: upc });
  },

  // handlePrint: async (shipmentId: string): Promise<boolean> => {
  //   set({ loadingShipmentId: shipmentId });

  //   try {
  //     const response = await fetch(`${PRINTER_BASE_URL}/print`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ shipmentId }),
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Print request failed: ${response.statusText}`);
  //     }

  //     set({ loadingShipmentId: null });
  //     return true;
  //   } catch (error) {
  //     console.error("Print error:", error);
  //     set({ loadingShipmentId: null });
  //     return false;
  //   }
  // },

  // handleManualPrint: async (
  //   shipmentId: string,
  //   pickListLinesId: number
  // ): Promise<boolean> => {
  //   const { checkedItems, pickListLines, printedShipments } = get();

  //   set({ loadingShipmentId: shipmentId });

  //   try {
  //     const isAlreadyChecked = checkedItems.has(pickListLinesId);

  //     // Find the line to check for duplicates
  //     const currentLine = pickListLines.find(
  //       (line) => line.PICK_LIST_LINES_ID === pickListLinesId
  //     );

  //     if (!currentLine) {
  //       throw new Error("Pick list line not found");
  //     }

  //     // Check for duplicate SHIPMENT_NUMBERs
  //     const shipmentCounts = pickListLines.reduce((acc, line) => {
  //       acc[line.SHIPMENT_NUMBER] = (acc[line.SHIPMENT_NUMBER] || 0) + 1;
  //       return acc;
  //     }, {} as Record<string, number>);

  //     const hasDuplicateShipment =
  //       shipmentCounts[currentLine.SHIPMENT_NUMBER] > 1;

  //     // If not checked and no duplicate, update first
  //     if (!isAlreadyChecked && !hasDuplicateShipment) {
  //       console.log(
  //         "Manual print: Updating shipment before printing:",
  //         shipmentId
  //       );

  //       const updateResponse = await fetch(
  //         `${API_BASE_URL}/api/update-picklist-lines?SHIPMENT_ID=${shipmentId}`
  //       );

  //       if (!updateResponse.ok) {
  //         throw new Error(
  //           `Update API call failed: ${updateResponse.status} ${updateResponse.statusText}`
  //         );
  //       }

  //       const updateResult = await updateResponse.json();
  //       console.log("Manual print update API response:", updateResult);

  //       if (updateResult.success === false) {
  //         throw new Error(
  //           updateResult.error || "Update API returned failure status"
  //         );
  //       }

  //       // Mark the item as checked after successful update
  //       const newCheckedItems = new Set<number>(checkedItems);
  //       newCheckedItems.add(pickListLinesId);

  //       // Update printed shipments
  //       const newPrintedShipments = new Set([...printedShipments, shipmentId]);

  //       set({
  //         checkedItems: newCheckedItems,
  //         printedShipments: newPrintedShipments,
  //       });

  //       console.log("Manual print: Item updated and marked as checked");
  //     } else if (isAlreadyChecked) {
  //       console.log("Manual print: Item already checked, only printing");
  //     } else if (hasDuplicateShipment) {
  //       console.log("Manual print: Duplicate shipment detected, only printing");
  //     }

  //     // Now proceed with printing
  //     const printResponse = await fetch(`${PRINTER_BASE_URL}/print`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ shipmentId }),
  //     });

  //     if (!printResponse.ok) {
  //       throw new Error(`Print request failed: ${printResponse.statusText}`);
  //     }

  //     console.log(
  //       "Manual print: Print request successful for shipment:",
  //       shipmentId
  //     );
  //     set({ loadingShipmentId: null });
  //     return true;
  //   } catch (error) {
  //     console.error("Manual print error:", error);
  //     set({ loadingShipmentId: null });
  //     return false;
  //   }
  // },

  clearPickListLines: () => {
    set({
      pickListLines: [],
      currentPickListId: null,
      pickListLinesError: null,
      checkedItems: new Set<number>(),
      currentCheckIndex: 0,
      searchTerm: "",
      matchedUPC: null,
      lastSearchTerm: "",
      isCheckingItem: false,
      lastApiCall: null,
      printedShipments: new Set(),
    });
  },

  clearSearch: () => {
    // Clear only search-related state, preserve checked items and print history
    set({
      searchTerm: "",
      matchedUPC: null,
      // Don't reset checkedItems - preserve them from API auto-check and user interactions
      currentCheckIndex: 0,
      lastSearchTerm: "",
      isCheckingItem: false,
      lastApiCall: null,
      // Don't reset printedShipments either - preserve print history
    });
  },

  // Computed properties
  getFilteredLines: () => {
    const { pickListLines, searchTerm } = get();
    if (!searchTerm) return pickListLines;

    // Show partial matches in the table for user to see what they're typing
    return pickListLines.filter((line) =>
      line.UPC?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  getCurrentCheckedItem: () => {
    const { pickListLines, matchedUPC, checkedItems } = get();

    if (!matchedUPC) return null;

    return (
      pickListLines.find(
        (line) =>
          line.UPC === matchedUPC && checkedItems.has(line.PICK_LIST_LINES_ID)
      ) || null
    );
  },

  getAllItemsCompleted: () => {
    const { pickListLines } = get();

    if (pickListLines.length === 0) return false;

    // Check if all lines have SHIPPED_QTY === QUANTITY
    return pickListLines.every(
      (line) =>
        line.SHIPPED_QTY !== null &&
        line.QUANTITY !== null &&
        line.SHIPPED_QTY === line.QUANTITY
    );
  },

  getCurrentPickList: () => {
    const { pickLists, currentPickListId } = get();

    if (!currentPickListId) return null;

    return (
      pickLists.find(
        (pickList) => pickList.PICK_LIST_ID === currentPickListId
      ) || null
    );
  },

  // Loading state setter
  setLoadingShipmentId: (shipmentId: string | null) => {
    set({ loadingShipmentId: shipmentId });
  },

  // Handle group print - update all lines in a group but print only once
  handleGroupPrint: async (
    shipmentId: string,
    pickListLineIds: number[],
    labelprinted: boolean
  ): Promise<boolean> => {
    const { checkedItems, printedShipments } = get();

    set({ loadingShipmentId: shipmentId });

    try {
      // Check if any lines are already checked
      const hasCheckedLines = pickListLineIds.some((id) =>
        checkedItems.has(id)
      );
      const allLinesChecked = pickListLineIds.every((id) =>
        checkedItems.has(id)
      );

      // If not all lines are checked, update them
      if (!allLinesChecked) {
        console.log(
          "Group print: Updating all lines for shipment:",
          shipmentId
        );

        const updateResponse = await fetch(
          `${API_BASE_URL}/api/update-picklist-lines?SHIPMENT_ID=${shipmentId}`
        );

        if (!updateResponse.ok) {
          throw new Error(
            `Update API call failed: ${updateResponse.status} ${updateResponse.statusText}`
          );
        }

        const updateResult = await updateResponse.json();
        console.log("Group print update API response:", updateResult);

        if (updateResult.success === false) {
          throw new Error(
            updateResult.error || "Update API returned failure status"
          );
        }

        // Mark ALL lines in this group as checked after successful update
        const newCheckedItems = new Set<number>(checkedItems);
        pickListLineIds.forEach((id) => {
          newCheckedItems.add(id);
        });

        // Update printed shipments
        const newPrintedShipments = new Set([...printedShipments, shipmentId]);

        set({
          checkedItems: newCheckedItems,
          printedShipments: newPrintedShipments,
        });

        console.log("Group print: All items updated and marked as checked");
      } else {
        console.log("Group print: All items already checked, only printing");
      }
      if (labelprinted) {
        console.log("Group print:  only printing");
        // Now proceed with printing (single print call for the whole group)
        const printResponse = await fetch(`${PRINTER_BASE_URL}/print`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shipmentId }),
        });

        if (!printResponse.ok) {
          throw new Error(`Print request failed: ${printResponse.statusText}`);
        }
      } else {
        console.log("Group print: generating new label");

        const printResponse = await fetch(
          `${PRINTER_BASE_URL}/generate-and-print`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shipmentId }),
          }
        );

        if (!printResponse.ok) {
          throw new Error(`Print request failed: ${printResponse.statusText}`);
        }
      }
      // console.log(
      //   "Group print: Print request successful for shipment:",
      //   shipmentId
      // );
      set({ loadingShipmentId: null });
      return true;
    } catch (error) {
      console.error("Group print error:", error);
      set({ loadingShipmentId: null });
      return false;
    }
  },
}));
