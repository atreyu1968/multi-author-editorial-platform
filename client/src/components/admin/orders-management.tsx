import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Package, Users, Eye, Search, Filter } from "lucide-react";
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

const statusLabels = {
  pending: "Pendiente",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

export default function OrdersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const { toast } = useToast();

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
        title: "Estado actualizado",
        description: "El estado del pedido se ha actualizado correctamente.",
      });
      setSelectedOrder(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido.",
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

  return (
    <div className="space-y-6">
      <h3 className="text-3xl font-bold text-primary" data-testid="title-orders">Gestión de Pedidos</h3>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="orders" data-testid="tab-orders">
            <Package className="h-4 w-4 mr-2" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por pedido, cliente, email..."
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
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
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
                  No se encontraron pedidos
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Pedido</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
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
                              {order.customerName || "Invitado"}
                            </TableCell>
                            <TableCell data-testid={`text-items-${order.id}`}>
                              {items.length} {items.length === 1 ? "item" : "items"}
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
                                    Ver Detalles
                                  </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                                  <SheetHeader>
                                    <SheetTitle>Detalles del Pedido</SheetTitle>
                                  </SheetHeader>
                                  
                                  {selectedOrder && (
                                    <div className="mt-6 space-y-6">
                                      {/* Order Info */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">Información del Pedido</h4>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">ID:</span>
                                            <span className="font-mono" data-testid="detail-order-id">{selectedOrder.id}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Número de Pedido:</span>
                                            <span data-testid="detail-order-number">{selectedOrder.orderNumber}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fecha:</span>
                                            <span data-testid="detail-order-date">
                                              {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "PPP", { locale: es }) : "-"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Estado:</span>
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
                                        <h4 className="font-semibold text-sm text-muted-foreground">Información del Cliente</h4>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nombre:</span>
                                            <span data-testid="detail-customer-name">{selectedOrder.customerName}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span data-testid="detail-customer-email">{selectedOrder.customerEmail}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Shipping Address */}
                                      {selectedOrder.shippingAddress && (() => {
                                        const address = parseShippingAddress(selectedOrder.shippingAddress);
                                        return address ? (
                                          <div className="space-y-2">
                                            <h4 className="font-semibold text-sm text-muted-foreground">Dirección de Envío</h4>
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
                                        <h4 className="font-semibold text-sm text-muted-foreground">Items del Pedido</h4>
                                        <div className="space-y-2">
                                          {parseOrderItems(selectedOrder.items).map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm border-b pb-2" data-testid={`detail-item-${idx}`}>
                                              <div>
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-muted-foreground text-xs">Cantidad: {item.quantity}</p>
                                              </div>
                                              <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Total */}
                                      <div className="space-y-2 pt-4 border-t">
                                        <div className="flex justify-between text-lg font-bold">
                                          <span>Total:</span>
                                          <span data-testid="detail-total">{formatCurrency(selectedOrder.totalAmount)}</span>
                                        </div>
                                      </div>

                                      {/* PayPal Info */}
                                      {selectedOrder.paypalOrderId && (
                                        <div className="space-y-2">
                                          <h4 className="font-semibold text-sm text-muted-foreground">Información de PayPal</h4>
                                          <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-muted-foreground">Order ID:</span>
                                              <span className="font-mono text-xs" data-testid="detail-paypal-order-id">{selectedOrder.paypalOrderId}</span>
                                            </div>
                                            {selectedOrder.paypalPayerId && (
                                              <div className="flex justify-between">
                                                <span className="text-muted-foreground">Payer ID:</span>
                                                <span className="font-mono text-xs" data-testid="detail-paypal-payer-id">{selectedOrder.paypalPayerId}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Status Update */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground">Actualizar Estado</h4>
                                        <Select
                                          value={selectedOrder.status}
                                          onValueChange={handleStatusUpdate}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <SelectTrigger data-testid="select-update-status">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pendiente</SelectItem>
                                            <SelectItem value="completed">Completado</SelectItem>
                                            <SelectItem value="failed">Fallido</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
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
              <CardTitle className="text-lg">Buscar Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
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
              <CardTitle>Clientes ({filteredCustomers.length})</CardTitle>
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
                  No se encontraron clientes
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Pedidos</TableHead>
                        <TableHead>Newsletter</TableHead>
                        <TableHead>Fecha de Registro</TableHead>
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
                              {customer.isSubscribedToNewsletter ? "Sí" : "No"}
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
