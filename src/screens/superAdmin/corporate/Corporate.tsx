"use client";

import { SiteHeader } from "@/components/superAdmin/site-header";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  IconPlus,
  IconDownload,
  IconBuilding,
  IconWallet,
  IconCalendar,
  IconLoader2,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import moment from "moment";
import { getRequest, postRequest } from "@/Apis/Api";

// --- Validation schema ---
const addTopupSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => Number(val) > 0, "Amount must be greater than 0"),
  purpose: z
    .string()
    .min(1, "Purpose is required")
    .max(500, "Purpose must be less than 500 characters"),
});
type AddTopupFormData = z.infer<typeof addTopupSchema>;

// --- API Types ---
interface TopupEntry {
  id: string;
  corporate_name?: string;
  name?: string;
  amount: number;
  created_at?: string;
  purpose_of_payment?: string;
}

interface CorporateClient {
  id: number;
  card_number: string;
  pin: string;
  name: string;
  mobile_number: string | null;
  balance: number;
  created_at: string;
  machine_code: string;
}

interface CorporatesClientResponse {
  corporateClients: CorporateClient[];
}

// --- Machine mapping ---
const machineCodes: Record<string, number[]> = {
  ibex: [3110],
  tapal: [3165, 3166, 3167],
  jpCoats: [3125, 3126],
  ebm: [3134, 3135, 3136, 3137],
  jaffer: [3169, 3170, 3171],
  getz: [3188, 3189, 3190, 3191],
  mobilink: [3194, 3195, 3196, 3197, 3198, 3199, 3200],
};

const Corporate = () => {
  const [activeTab, setActiveTab] = useState("corporate-topups");
  const [topupHistory, setTopupHistory] = useState<TopupEntry[]>([]);
  const [isAddTopupOpen, setIsAddTopupOpen] = useState(false);

  // Client states
  const [clientsData, setClientsData] = useState<
    Record<string, CorporateClient[]>
  >({
    ibex: [],
    tapal: [],
    jaffer: [],
    jpCoats: [],
    ebm: [],
    mobilink: [],
    getz: [],
  });

  // Filters + pagination
  const [dateFilter, setDateFilter] = useState("");
  const [minBalance, setMinBalance] = useState("");
  const [maxBalance, setMaxBalance] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Add Topup form
  const addTopupForm = useForm<AddTopupFormData>({
    resolver: zodResolver(addTopupSchema),
    defaultValues: { clientName: "", amount: "", purpose: "" },
  });

  const onAddTopupSubmit = async (data: AddTopupFormData) => {
    const newTopup: TopupEntry = {
      id: Date.now().toString(),
      name: data.clientName,
      amount: Number(data.amount),
      created_at: new Date().toISOString(),
      purpose_of_payment: data.purpose,
    };
    setTopupHistory((prev) => [newTopup, ...prev]);
    addTopupForm.reset();
    setIsAddTopupOpen(false);
  };

  const getClientData = (tabName: string): CorporateClient[] =>
    clientsData[tabName] || [];

  // 🔎 Search
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => e.preventDefault();

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // 🧹 Reset filters
  const resetFilters = () => {
    setDateFilter("");
    setMinBalance("");
    setMaxBalance("");
    setSearchTerm("");
    setCurrentPage(1);
    setSelectedItems([]);
  };

  const getFilteredClientData = (data: CorporateClient[]) => {
    return data.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.card_number && item.card_number.includes(searchTerm)) ||
        (item.mobile_number && item.mobile_number.includes(searchTerm));

      const matchesDate =
        !dateFilter || moment(item.created_at).isSame(dateFilter, "day");
      const matchesMinBalance =
        !minBalance || item.balance >= Number(minBalance);
      const matchesMaxBalance =
        !maxBalance || item.balance <= Number(maxBalance);

      return (
        matchesSearch && matchesDate && matchesMinBalance && matchesMaxBalance
      );
    });
  };

  // Tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetFilters();
    if (
      [
        "ibex",
        "tapal",
        "getz",
        "jpCoats",
        "ebm",
        "mobilink",
        "jaffer",
      ].includes(value)
    ) {
      fetchClientsByTab(value);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US").format(amount);

  // --- Fetch Topups ---
  useEffect(() => {
    const fetchTopups = async () => {
      try {
        const data = await getRequest<TopupEntry[]>(
          "/superadmin/getCorporateTopupHistory"
        );
        if (Array.isArray(data)) setTopupHistory(data);
      } catch (e) {
        console.error("Failed to fetch topups:", e);
      }
    };
    fetchTopups();
  }, []);

  // --- Fetch Clients by Tab ---
  const fetchClientsByTab = async (tab: string) => {
    try {
      const codes = machineCodes[tab];
      if (!codes) return;
      const res = await postRequest<CorporatesClientResponse>(
        "/superadmin/getCorporateClientsByMachines",
        { machineCodes: codes }
      );
      setClientsData((prev) => ({ ...prev, [tab]: res.corporateClients }));
    } catch (e) {
      console.error(`Failed to fetch clients for ${tab}:`, e);
    }
  };

  const totalTopupAmount = topupHistory.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  
  const uniqueClients = new Set(
    topupHistory.map((item) => item.name || item.corporate_name)
  ).size;

  return (
    <div>
      <SiteHeader title="Corporate Clients" />
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {/* --- Stats --- */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Clients
              </CardTitle>
              <IconBuilding className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueClients}</div>
              <p className="text-xs text-muted-foreground">
                Active corporate clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Topups
              </CardTitle>
              <IconWallet className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topupHistory.length}</div>
              <p className="text-xs text-muted-foreground">All time topups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
              <IconWallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalTopupAmount)}
              </div>
              <p className="text-xs text-muted-foreground">Total topup value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <IconCalendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {
                  topupHistory.filter((item) =>
                    moment(item.created_at).isSame(moment(), "month")
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Recent topups</p>
            </CardContent>
          </Card>
        </div>

        {/* --- Tabs --- */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="corporate-topups">Corporate Topups</TabsTrigger>
            <TabsTrigger value="ibex">Ibex</TabsTrigger>
            <TabsTrigger value="tapal">Tapal</TabsTrigger>
            <TabsTrigger value="getz">Getz</TabsTrigger>
            <TabsTrigger value="jpCoats">Jp Coats</TabsTrigger>
            <TabsTrigger value="ebm">Ebm</TabsTrigger>
            <TabsTrigger value="jaffer">Jaffer</TabsTrigger>
            <TabsTrigger value="mobilink">Mobilink</TabsTrigger>
          </TabsList>

          {/* --- Topups Tab --- */}
          <TabsContent value="corporate-topups" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Corporate Topup History</CardTitle>
                    <CardDescription>
                      A list of all the corporate topup history in your account
                      including their name, amount, purpose and date.
                    </CardDescription>
                  </div>
                  <Dialog
                    open={isAddTopupOpen}
                    onOpenChange={setIsAddTopupOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-teal-600 hover:bg-teal-700">
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Topup
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Corporate Topup</DialogTitle>
                        <DialogDescription>
                          Add a new topup entry for a corporate client.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...addTopupForm}>
                        <form
                          onSubmit={addTopupForm.handleSubmit(onAddTopupSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={addTopupForm.control}
                            name="clientName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter client name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addTopupForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={addTopupForm.control}
                            name="purpose"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Purpose</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter purpose of topup"
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddTopupOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={addTopupForm.formState.isSubmitting}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              {addTopupForm.formState.isSubmitting ? (
                                <>
                                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                "Add Topup"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Purpose</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topupHistory.length > 0 ? (
                        topupHistory.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {entry.corporate_name || entry.name}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {moment(entry.created_at).format(
                                "ddd, MMM D, YYYY h:mm A"
                              )}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div
                                className="truncate"
                                title={entry.purpose_of_payment}
                              >
                                {entry.purpose_of_payment}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No topup history available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Client Tabs --- */}
          {[
            "ibex",
            "tapal",
            "getz",
            "jpCoats",
            "ebm",
            "mobilink",
            "jaffer",
          ].map((tabName) => {
            const clientData = getClientData(tabName);
            const filteredData = getFilteredClientData(clientData);
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = filteredData.slice(startIndex, endIndex);

            return (
              <TabsContent key={tabName} value={tabName} className="space-y-4">
                <form onSubmit={handleSearch} className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, mobile number, or card number"
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <IconX className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </form>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{tabName.toUpperCase()}</CardTitle>
                      <Button className="bg-teal-600 hover:bg-teal-700">
                        <IconDownload className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12">
                              <Checkbox
                                checked={
                                  selectedItems.length ===
                                    paginatedData.length &&
                                  paginatedData.length > 0
                                }
                                onCheckedChange={(checked) =>
                                  setSelectedItems(
                                    checked
                                      ? paginatedData.map((d) =>
                                          d.id.toString()
                                        )
                                      : []
                                  )
                                }
                              />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Card Number</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.length > 0 ? (
                            paginatedData.map((entry) => (
                              <TableRow
                                key={entry.id}
                                className="hover:bg-muted/50"
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedItems.includes(
                                      entry.id.toString()
                                    )}
                                    onCheckedChange={(checked) =>
                                      setSelectedItems((prev) =>
                                        checked
                                          ? [...prev, entry.id.toString()]
                                          : prev.filter(
                                              (id) => id !== entry.id.toString()
                                            )
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  {entry.name || entry.mobile_number}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {entry.card_number || entry.mobile_number}
                                </TableCell>
                                <TableCell>
                                  {moment(entry.created_at).format(
                                    "ddd, MMM D, YYYY h:mm A"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {formatCurrency(entry.balance)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No data found matching your criteria.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between items-center mt-4 px-4 pb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredData.length)} of{" "}
                    {filteredData.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                      variant="outline"
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === page
                              ? "bg-teal-600 hover:bg-teal-700"
                              : ""
                          }`}
                          variant={currentPage === page ? "default" : "outline"}
                        >
                          {page}
                        </Button>
                      )
                    )}
                    <Button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="h-8 w-8 p-0"
                      variant="outline"
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default Corporate;
