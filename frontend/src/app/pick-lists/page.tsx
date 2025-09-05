"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Package,
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { usePickListStore } from "@/store/usePickListStore";
import LastSyncBanner from "@/components/Last-sync-banner";
import { GLOBAL_ENTITY_ID, GLOBAL_ENTITY_NAME } from "@/lib/constant";

const PickListsPage = () => {
  const router = useRouter();

  // Protect the route
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  //   const { isAuthenticated, username, logout } = useAuthStore((state) => ({
  //   isAuthenticated: state.isAuthenticated,
  //   username: state.username,
  //   logout: state.logout,
  // }));
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending
  const [entityId, setEntityId] = useState<number | null>(null);

  const {
    pickLists,
    pickListsLoading,
    pickListsError,
    allPickListsStats,
    fetchPickLists,
    fetchPickListsStats,
    clearPickListLines,
    clearSearch,
    setPackingPerson,
  } = usePickListStore();

  useEffect(() => {
    fetchPickLists(statusFilter, entityId);
    fetchPickListsStats();
    clearPickListLines();
    clearSearch();
  }, [
    statusFilter,
    fetchPickLists,
    fetchPickListsStats,
    clearPickListLines,
    clearSearch,
    entityId,
    setEntityId,
  ]);

  const handleRowClick = (pickListId: number) => {
    router.push(`/pick-lists-lines?PICK_LIST_ID=${pickListId}`);
  };

  const handleRefresh = () => {
    fetchPickLists(statusFilter);
    fetchPickListsStats();
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
  };

  // Filter and search logic
  const filteredPickLists = pickLists.filter((pick) => {
    const matchesSearch =
      pick.ORDER_NUMBER.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pick.PICK_LIST_ID.toString().includes(searchTerm) ||
      (pick.REMARKS &&
        pick.REMARKS.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // Stats calculation - use store stats if available, fallback to current list
  const stats = allPickListsStats || {
    total: pickLists.length,
    pending: pickLists.filter((p) => p.status === "pending").length,
    completed: pickLists.filter((p) => p.status === "completed").length,
  };

  // Additional stats
  const additionalStats = {
    assigned: pickLists.filter((p) => p.ASSIGNEE_ID).length,
    today: pickLists.filter((p) => {
      const today = new Date();
      const orderDate = new Date(p.ORDER_DATE);
      return orderDate.toDateString() === today.toDateString();
    }).length,
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!isAuthenticated) return null;

  // Loading state
  if (pickListsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="text-lg font-medium text-slate-600">
                Loading pick lists...
              </div>
              <div className="text-sm text-slate-400">
                Fetching your dispatch data
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (pickListsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <Card className="w-full max-w-md border-red-200 bg-red-50">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error Loading Pick Lists
                </h3>
                <p className="text-red-700 mb-4">{pickListsError}</p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Pick Lists
                </h1>
                <p className="text-slate-500 text-sm">
                  Manage and track your dispatch operations
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <LastSyncBanner />

              <Button
                onClick={handleRefresh}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Total Lists
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.total}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.completed}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Today</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {additionalStats.today}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by order number, pick list ID, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => handleStatusChange("pending")}
                  className="flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Pending ({stats.pending})
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => handleStatusChange("completed")}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Completed ({stats.completed})
                </Button>
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => handleStatusChange("all")}
                  className="flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  All ({stats.total})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pick Lists Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pick Lists ({filteredPickLists.length})
              <Button
                onClick={(e) => {
                  !entityId
                    ? setEntityId(Number(GLOBAL_ENTITY_ID))
                    : setEntityId(null);
                }}
              >
                Fetch my pick lists
              </Button>
              <div className="flex items-baseline gap-2 text-xl">
                <span className="text-slate-500">Hello,</span>
                <span className="font-semibold text-gray-900">
                  {GLOBAL_ENTITY_NAME}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPickLists.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No pick lists found
                </h3>
                <p className="text-slate-500">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No pick lists available at the moment"}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-slate-50/80 border-slate-200/60">
                      <TableHead className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Pick List ID
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Order Number
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Order Date
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Assignee
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Packaging Person
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Remarks
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPickLists.map((pick) => (
                      <TableRow
                        key={pick.PICK_LIST_ID}
                        className="cursor-pointer hover:bg-blue-50/50 transition-all duration-200 border-slate-200/40 group"
                      >
                        <TableCell className="font-medium text-slate-900">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            #{pick.PICK_LIST_ID}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          {pick.ORDER_NUMBER}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {format(new Date(pick.ORDER_DATE), "MMM dd, yyyy")}
                          <div className="text-xs text-slate-400 mt-0.5">
                            {format(new Date(pick.ORDER_DATE), "hh:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pick.status === "completed" ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 border-green-200"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-orange-50 text-orange-700 border-orange-200"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {pick.ASSIGNEE_ID ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 border-blue-200"
                            >
                              <User className="w-3 h-3 mr-1" />
                              {pick.ASSIGNEE_NAME}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-700 border-gray-200"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {pick.PACKING_PERSON_NAME ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 border-green-200"
                            >
                              <User className="w-3 h-3 mr-1" />
                              {pick.PACKING_PERSON_NAME}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-700 border-gray-200"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-xs truncate">
                          {pick.REMARKS || (
                            <span className="text-slate-400 italic">
                              No remarks
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {Number(pick.PACKING_PERSON) ===
                          Number(GLOBAL_ENTITY_ID) ? (
                            <ArrowRight
                              onClick={() => handleRowClick(pick.PICK_LIST_ID)}
                              className=" w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200"
                            />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 border-blue-200 disabled:bg-gray-400 disabled:text-white"
                            disabled={
                              !!pick.PACKING_PERSON_NAME ||
                              pick.PACKING_PERSON === GLOBAL_ENTITY_ID
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Assign to me logic here
                              await setPackingPerson(
                                pick.PICK_LIST_ID,
                                GLOBAL_ENTITY_ID,
                                GLOBAL_ENTITY_NAME
                              );
                              // Refresh the picklists after assignment
                              // await fetchPickLists(statusFilter);
                              console.log(
                                `Assigning pick list ${pick.PICK_LIST_ID} to ${GLOBAL_ENTITY_ID}`
                              );
                            }}
                          >
                            <User className="w-3 h-3 mr-1" />
                            Assign To Me
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Stats */}
        <div className="text-center text-slate-500 text-sm">
          Showing {filteredPickLists.length} of {pickLists.length} pick lists
        </div>
      </div>
    </div>
  );
};

export default PickListsPage;
