import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Users, Eye, Search, Filter } from "lucide-react";
import { useUiText } from "@/contexts/ui-text-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Order, Customer } from "@shared/schema";

interface OrderWithCustomer extends Order {
  customer?: Customer;
}

interface OrderItem {
  productId: string;
  productType: string;
  title: string;
  quantity: number;
  price: number;
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  completed: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
  cancelled: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
};


export default function OrdersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const { toast } = useToast();

  const t = {
    statusPending: useUiText("admin.orders", "status_pending", "Pendiente"),
    statusCompleted: useUiText("admin.orders", "status_completed", "Completado"),
    statusFailed: useUiText("admin.orders", "status_failed", "Fallido"),
    statusCancelled: useUiText("admin.orders", "status_cancelled", "Cancelado"),
    toastUpdateTitle: useUiText("admin.orders", "toast_update_title", "Estado actualizado"),
    toastUpdateDescription: useUiText("admin.orders", "toast_update_description", "El estado del pedido se ha actualizado correctamente."),
    toastUpdateErrorTitle: useUiText("admin.orders", "toast_update_error_title", "Error"),
    toastUpdateErrorDescription: useUiText("admin.orders", "toast_update_error_description", "No se pudo actualizar el estado del pedido."),
    pageTitle: useUiText("admin.orders", "page_title", "Gestión de Pedidos"),
    tabOrders: useUiText("admin.orders", "tab_orders", "Pedidos"),
    tabCustomers: useUiText("admin.orders", "tab_customers", "Clientes"),
    filtersTitle: useUiText("admin.orders", "filters_title", "Filtros"),
    placeholderSearchOrders: useUiText("admin.orders", "placeholder_search_orders", "Buscar por pedido, cliente, email..."),
    filterAllStatuses: useUiText("admin.orders", "filter_all_statuses", "Todos los estados"),
    ordersCount: useUiText("admin.orders", "orders_count", "Pedidos"),
    emptyStateOrders: useUiText("admin.orders", "empty_state_orders", "No se encontraron pedidos"),
    tableHeaderOrderId: useUiText("admin.orders", "table_header_order_id", "ID Pedido"),
    tableHeaderDate: useUiText("admin.orders", "table_header_date", "Fecha"),
    tableHeaderCustomer: useUiText("admin.orders", "table_header_customer", "Cliente"),
    tableHeaderItems: useUiText("admin.orders", "table_header_items", "Items"),
    tableHeaderTotal: useUiText("admin.orders", "table_header_total", "Total"),
    tableHeaderStatus: useUiText("admin.orders", "table_header_status", "Estado"),
    tableHeaderActions: useUiText("admin.orders", "table_header_actions", "Acciones"),
    guestLabel: useUiText("admin.orders", "guest_label", "Invitado"),
    itemSingular: useUiText("admin.orders", "item_singular", "item"),
    itemPlural: useUiText("admin.orders", "item_plural", "items"),
    buttonViewDetails: useUiText("admin.orders", "button_view_details", "Ver Detalles"),
    sheetTitle: useUiText("admin.orders", "sheet_title", "Detalles del Pedido"),
    sectionOrderInfo: useUiText("admin.orders", "section_order_info", "Información del Pedido"),
    labelId: useUiText("admin.orders", "label_id", "ID:"),
    labelOrderNumber: useUiText("admin.orders", "label_order_number", "Número de Pedido:"),
    labelDate: useUiText("admin.orders", "label_date", "Fecha:"),
    labelStatus: useUiText("admin.orders", "label_status", "Estado:"),
    sectionCustomerInfo: useUiText("admin.orders", "section_customer_info", "Información del Cliente"),
    labelName: useUiText("admin.orders", "label_name", "Nombre:"),
    labelEmail: useUiText("admin.orders", "label_email", "Email:"),
    sectionShippingAddress: useUiText("admin.orders", "section_shipping_address", "Dirección de Envío"),
    sectionOrderItems: useUiText("admin.orders", "section_order_items", "Items del Pedido"),
    labelQuantity: useUiText("admin.orders", "label_quantity", "Cantidad:"),
    labelTotal: useUiText("admin.orders", "label_total", "Total:"),
    sectionPaypalInfo: useUiText("admin.orders", "section_paypal_info", "Información de PayPal"),
    labelPaypalOrderId: useUiText("admin.orders", "label_paypal_order_id", "Order ID:"),
    labelPaypalPayerId: useUiText("admin.orders", "label_paypal_payer_id", "Payer ID:"),
    sectionUpdateStatus: useUiText("admin.orders", "section_update_status", "Actualizar Estado"),
    customerSearchTitle: useUiText("admin.orders", "customer_search_title", "Buscar Cliente"),
    placeholderSearchCustomers: useUiText("admin.orders", "placeholder_search_customers", "Buscar por nombre o email..."),
    customersCount: useUiText("admin.orders", "customers_count", "Clientes"),
    emptyStateCustomers: useUiText("admin.orders", "empty_state_customers", "No se encontraron clientes"),
    tableHeaderName: useUiText("admin.orders", "table_header_name", "Nombre"),
    tableHeaderEmail: useUiText("admin.orders", "table_header_email", "Email"),
    tableHeaderOrders: useUiText("admin.orders", "table_header_orders", "Pedidos"),
    tableHeaderNewsletter: useUiText("admin.orders", "table_header_newsletter", "Newsletter"),
    tableHeaderRegistrationDate: useUiText("admin.orders", "table_header_registration_date", "Fecha de Registro"),
    newsletterYes: useUiText("admin.orders", "newsletter_yes", "Sí"),
    newsletterNo: useUiText("admin.orders", "newsletter_no", "No"),
  };

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t.toastUpdateTitle,
        description: t.toastUpdateDescription,
      });
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: t.toastUpdateErrorTitle,
        description: t.toastUpdateErrorDescription,
        variant: "destructive",
      });
    },
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [orders, statusFilter, searchQuery]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery) return customers;

    const query = customerSearchQuery.toLowerCase();
    return customers.filter(customer =>
      customer.fullName.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
    );
  }, [customers, customerSearchQuery]);

  // Calculate orders count per customer
  const customerOrdersCount = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.customerId) {
        counts[order.customerId] = (counts[order.customerId] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Parse order items
  const parseOrderItems = (itemsJson: string): OrderItem[] => {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  };

  // Parse shipping address
  const parseShippingAddress = (addressJson: string | null) => {
    if (!addressJson) return null;
    try {
      return JSON.parse(addressJson);
    } catch {
      return null;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: string) => {
    if (selectedOrder) {
      updateStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus });
    }
  };

  const statusLabels = {
    pending: t.statusPending,
    completed: t.statusCompleted,
    failed: t.statusFailed,
    cancelled: t.statusCancelled,
  };

  return (
    <div className="space-y-6">
      <h3 className="text-3xl font-bold text-primary" data-testid="title-orders">{t.pageTitle}</h3>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="orders" data-testid="tab-orders">
            <Package className="h-4 w-4 mr-2" />
            {t.tabOrders}
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            {t.tabCustomers}
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.filtersTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.placeholderSearchOrders}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-orders"
                  />
                </div>
              </div>
              <div className="w-full sm:w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.filterAllStatuses}</SelectItem>
                    <SelectItem value="pending">{t.statusPending}</SelectItem>
                    <SelectItem value="completed">{t.statusCompleted}</SelectItem>
                    <SelectItem value="failed">{t.statusFailed}</SelectItem>
                    <SelectItem value="cancelled">{t.statusCancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.ordersCount} ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.emptyStateOrders}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.tableHeaderOrderId}</TableHead>
                        <TableHead>{t.tableHeaderDate}</TableHead>
                        <TableHead>{t.tableHeaderCustomer}</TableHead>
                        <TableHead>{t.tableHeaderItems}</TableHead>
                        <TableHead>{t.tableHeaderTotal}</TableHead>
                        <TableHead>{t.tableHeaderStatus}</TableHead>
                        <TableHead>{t.tableHeaderActions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const items = parseOrderItems(order.items);
                        const shortId = order.id.substring(0, 8);
                        
                        return (
                          <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-mono text-sm cursor-help" data-testid={`text-order-id-${order.id}`}>
                                      {shortId}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-mono text-xs">{order.id}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell data-testid={`text-date-${order.id}`}>
                              {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                            </TableCell>
                            <TableCell data-testid={`text-customer-${order.id}`}>
                              {order.customerName || t.guestLabel}
                            </TableCell>
                            <TableCell data-testid={`text-items-${order.id}`}>
                              {items.length} {items.length === 1 ? t.itemSingular : t.itemPlural}
                            </TableCell>
                            <TableCell data-testid={`text-total-${order.id}`}>
                              {formatCurrency(order.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={statusColors[order.status as keyof typeof statusColors]}
                                data-testid={`badge-status-${order.id}`}
                              >
                                {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedOrder(order)}
                                    data-testid={`button-view-details-${order.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t.buttonViewDetails}
                                  </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                                  <SheetHeader>
                                    <SheetTitle>{t.sheetTitle}</SheetTitle>
                                  </SheetHeader>
                                  
                                  {selectedOrder && (
                                    <div className="mt-6 space-y-6">
                                      {/* Order Info */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">{t.sectionOrderInfo}</h4>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.labelId}</span>
                                            <span className="font-mono" data-testid="detail-order-id">{selectedOrder.id}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.labelOrderNumber}</span>
                                            <span data-testid="detail-order-number">{selectedOrder.orderNumber}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.labelDate}</span>
                                            <span data-testid="detail-order-date">
                                              {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "PPP", { locale: es }) : "-"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">{t.labelStatus}</span>
                                            <Badge
                                              className={statusColors[selectedOrder.status as keyof typeof statusColors]}
                                              data-testid="detail-order-status"
                                            >
                                              {statusLabels[selectedOrder.status as keyof typeof statusLabels] || selectedOrder.status}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Customer Info */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">{t.sectionCustomerInfo}</h4>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.labelName}</span>
                                            <span data-testid="detail-customer-name">{selectedOrder.customerName}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.labelEmail}</span>
                                            <span data-testid="detail-customer-email">{selectedOrder.customerEmail}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Shipping Address */}
                                      {selectedOrder.shippingAddress && (() => {
                                        const address = parseShippingAddress(selectedOrder.shippingAddress);
                                        return address ? (
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground">{t.sectionShippingAddress}</h4>
                                            <div className="text-sm" data-testid="detail-shipping-address">
                                              <p>{address.street}</p>
                                              <p>{address.city}, {address.state} {address.zipCode}</p>
                                              <p>{address.country}</p>
                                            </div>
                                          </div>
                                        ) : null;
                                      })()}

                                      {/* Items */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">{t.sectionOrderItems}</h4>
                                        <div className="space-y-2">
                                          {parseOrderItems(selectedOrder.items).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm border-b pb-2" data-testid={`detail-item-${idx}`}>
                                              <div>
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-muted-foreground text-xs">{t.labelQuantity} {item.quantity}</p>
                                              </div>
                                              <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Total */}
                                      <div className="space-y-2 pt-4 border-t">
                                        <div className="flex justify-between text-lg font-bold">
                                          <span>{t.labelTotal}</span>
                                          <span data-testid="detail-total">{formatCurrency(selectedOrder.totalAmount)}</span>
                                        </div>
                                      </div>

                                      {/* PayPal Info */}
                                      {selectedOrder.paypalOrderId && (
                                        <div className="space-y-2">
                                          <h4 className="font-semibold text-sm text-muted-foreground">{t.sectionPaypalInfo}</h4>
                                          <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">{t.labelPaypalOrderId}</span>
                                              <span className="font-mono text-xs" data-testid="detail-paypal-order-id">{selectedOrder.paypalOrderId}</span>
                                            </div>
                                            {selectedOrder.paypalPayerId && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t.labelPaypalPayerId}</span>
                                                <span className="font-mono text-xs" data-testid="detail-paypal-payer-id">{selectedOrder.paypalPayerId}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Status Update */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">{t.sectionUpdateStatus}</h4>
                                        <Select
                                          value={selectedOrder.status}
                                          onValueChange={handleStatusUpdate}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <SelectTrigger data-testid="select-update-status">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">{t.statusPending}</SelectItem>
                                            <SelectItem value="completed">{t.statusCompleted}</SelectItem>
                                            <SelectItem value="failed">{t.statusFailed}</SelectItem>
                                            <SelectItem value="cancelled">{t.statusCancelled}</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  )}
                                </SheetContent>
                              </Sheet>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.customerSearchTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.placeholderSearchCustomers}
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-customers"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t.customersCount} ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.emptyStateCustomers}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.tableHeaderName}</TableHead>
                        <TableHead>{t.tableHeaderEmail}</TableHead>
                        <TableHead>{t.tableHeaderOrders}</TableHead>
                        <TableHead>{t.tableHeaderNewsletter}</TableHead>
                        <TableHead>{t.tableHeaderRegistrationDate}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                          <TableCell data-testid={`text-customer-name-${customer.id}`}>
                            {customer.fullName}
                          </TableCell>
                          <TableCell data-testid={`text-customer-email-${customer.id}`}>
                            {customer.email}
                          </TableCell>
                          <TableCell data-testid={`text-customer-orders-${customer.id}`}>
                            {customerOrdersCount[customer.id] || 0}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={customer.isSubscribedToNewsletter ? "default" : "secondary"}
                              data-testid={`badge-newsletter-${customer.id}`}
                            >
                              {customer.isSubscribedToNewsletter ? t.newsletterYes : t.newsletterNo}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-customer-date-${customer.id}`}>
                            {customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: es }) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
