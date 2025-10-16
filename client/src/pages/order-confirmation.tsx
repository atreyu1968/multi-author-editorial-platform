import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Home, FileText, ShoppingBag, AlertCircle, Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/format-currency";
import type { Order, Customer, Book, EditorialSettings } from "@shared/schema";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { user } = useAuth();

  const { data: orderResponse, isLoading, error: orderError, refetch } = useQuery<Order & { customer?: Customer, downloadTokens?: Array<{ bookId: string, bookTitle: string, token: string, expiresAt: string }> }>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  const { data: settings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
  });

  const order = orderResponse;
  const customer = orderResponse?.customer;
  const downloadTokens = orderResponse?.downloadTokens || [];

  // Get book IDs from order items
  const orderItems = order?.items ? JSON.parse(order.items) : [];
  const bookIds = orderItems
    .filter((item: any) => item.productType === 'book')
    .map((item: any) => item.productId);

  // Fetch book details for all books in the order
  const { data: books = [] } = useQuery<Book[]>({
    queryKey: ['/api/books', { ids: bookIds }],
    queryFn: async () => {
      if (bookIds.length === 0) return [];
      const bookPromises = bookIds.map((id: string) => 
        fetch(`/api/books/${id}`).then(res => res.json())
      );
      return Promise.all(bookPromises);
    },
    enabled: bookIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card data-testid="card-loading">
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card data-testid="card-error">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" data-testid="icon-error" />
              <div>
                <CardTitle data-testid="text-error-title">Pedido no encontrado</CardTitle>
                <CardDescription data-testid="text-error-description">
                  No pudimos encontrar el pedido solicitado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground" data-testid="text-error-message">
              El pedido que buscas no existe o ha sido eliminado.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                Reintentar
              </Button>
              <Link href="/">
                <Button data-testid="button-home">
                  <Home className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shippingAddress = order?.shippingAddress ? JSON.parse(order.shippingAddress) : null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      completed: { variant: "default", label: "Completado" },
      failed: { variant: "destructive", label: "Fallido" },
      cancelled: { variant: "outline", label: "Cancelado" },
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-green-200 dark:border-green-800" data-testid="card-order-confirmation">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" data-testid="icon-success" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400" data-testid="text-confirmation-title">
              ¡Pedido Confirmado!
            </CardTitle>
            <CardDescription className="text-base mt-2" data-testid="text-confirmation-subtitle">
              Gracias por tu compra. Tu pedido ha sido procesado exitosamente.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2" data-testid="section-order-info">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" data-testid="label-order-number">Número de Pedido:</span>
              <span className="font-mono font-semibold" data-testid="text-order-number">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" data-testid="label-order-status">Estado:</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" data-testid="label-order-date">Fecha:</span>
              <span className="text-sm" data-testid="text-order-date">{formatDate(order.createdAt)}</span>
            </div>
            {order.paypalOrderId && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" data-testid="label-transaction-id">ID de Transacción PayPal:</span>
                <span className="text-sm font-mono" data-testid="text-transaction-id">{order.paypalOrderId}</span>
              </div>
            )}
          </div>

          <Separator />

          <div data-testid="section-customer-info">
            <h3 className="font-semibold mb-3" data-testid="text-customer-info-title">Información del Cliente</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground" data-testid="label-customer-name">Nombre: </span>
                <span data-testid="text-customer-name">{order.customerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground" data-testid="label-customer-email">Email: </span>
                <span data-testid="text-customer-email">{order.customerEmail}</span>
              </div>
              {shippingAddress && (
                <div>
                  <span className="text-muted-foreground" data-testid="label-shipping-address">Dirección de Envío: </span>
                  <span data-testid="text-shipping-address">{shippingAddress}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div data-testid="section-order-items">
            <h3 className="font-semibold mb-3" data-testid="text-items-title">Artículos del Pedido</h3>
            <div className="space-y-3">
              {orderItems.map((item: any, index: number) => {
                const book = item.productType === 'book' 
                  ? books.find((b: Book) => b.id === item.productId)
                  : null;
                const isDigital = book?.isDigitalProduct && book?.digitalFiles;
                const downloadToken = downloadTokens.find(dt => dt.bookId === item.productId);
                
                const formatExpirationDate = (dateString: string) => {
                  try {
                    return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
                  } catch {
                    return dateString;
                  }
                };
                
                return (
                  <div 
                    key={index} 
                    className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg"
                    data-testid={`order-item-${index}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-item-name-${index}`}>
                          {item.name}
                          {isDigital && (
                            <Badge variant="secondary" className="ml-2" data-testid={`badge-digital-${item.productId}`}>
                              Digital
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-item-quantity-${index}`}>
                          Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-item-price-${index}`}>
                          Precio unitario: {formatCurrency(item.price || 0, settings?.currency || "USD", settings?.currencySymbol || "$")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-item-subtotal-${index}`}>
                          {formatCurrency((item.price || 0) * item.quantity, settings?.currency || "USD", settings?.currencySymbol || "$")}
                        </p>
                      </div>
                    </div>
                    
                    {isDigital && downloadToken && (
                      <div className="space-y-2">
                        <Button
                          asChild
                          variant="default"
                          className="w-full"
                          data-testid={`button-download-${item.productId}`}
                        >
                          <a href={`/api/download/${downloadToken.token}`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar {(() => {
                              try {
                                if (book?.digitalFiles) {
                                  const formats = JSON.parse(book.digitalFiles);
                                  return Object.keys(formats).map(f => f.toUpperCase()).join('/');
                                }
                              } catch {}
                              return 'Archivo';
                            })()}
                          </a>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center" data-testid={`text-expiration-${item.productId}`}>
                          Link válido hasta {formatExpirationDate(downloadToken.expiresAt)}
                        </p>
                      </div>
                    )}
                    {isDigital && !downloadToken && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        El enlace de descarga estará disponible cuando se complete el pedido
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center text-lg font-bold" data-testid="section-total">
            <span data-testid="label-total">Total:</span>
            <span data-testid="text-total">{formatCurrency(order.totalAmount, settings?.currency || "USD", settings?.currencySymbol || "$")}</span>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-testid="section-next-steps">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2" data-testid="text-next-steps-title">
              Próximos Pasos
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="text-next-steps-message">
              Recibirás un correo electrónico de confirmación con los detalles de tu pedido. 
              Si tu pedido incluye productos digitales, encontrarás los enlaces de descarga en el correo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                <Home className="h-4 w-4 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
            {user && (
              <Link href="/mis-pedidos" className="flex-1">
                <Button variant="outline" className="w-full" data-testid="button-my-orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Ver Mis Pedidos
                </Button>
              </Link>
            )}
            <Button variant="outline" className="flex-1" disabled data-testid="button-download-invoice">
              <FileText className="h-4 w-4 mr-2" />
              Descargar Factura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
