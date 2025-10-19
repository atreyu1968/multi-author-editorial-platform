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
import { formatPriceWithConversionSync } from "@shared/currency-service";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";
import type { Order, Customer, Book, EditorialSettings } from "@shared/schema";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { locale, currency, exchangeRates } = useLocale();

  const t = {
    orderNotFoundTitle: useUiText("checkout", "order_not_found_title", "Pedido no encontrado"),
    orderNotFoundDesc: useUiText("checkout", "order_not_found_desc", "No pudimos encontrar el pedido solicitado"),
    orderNotFoundMessage: useUiText("checkout", "order_not_found_message", "El pedido que buscas no existe o ha sido eliminado."),
    buttonRetry: useUiText("checkout", "button_retry", "Reintentar"),
    buttonBackHome: useUiText("checkout", "button_back_home", "Volver al Inicio"),
    statusPending: useUiText("checkout", "status_pending", "Pendiente"),
    statusCompleted: useUiText("checkout", "status_completed", "Completado"),
    statusFailed: useUiText("checkout", "status_failed", "Fallido"),
    statusCancelled: useUiText("checkout", "status_cancelled", "Cancelado"),
    orderConfirmedTitle: useUiText("checkout", "order_confirmed_title", "¡Pedido Confirmado!"),
    orderConfirmedSubtitle: useUiText("checkout", "order_confirmed_subtitle", "Gracias por tu compra. Tu pedido ha sido procesado exitosamente."),
    labelOrderNumber: useUiText("checkout", "label_order_number", "Número de Pedido:"),
    labelOrderStatus: useUiText("checkout", "label_order_status", "Estado:"),
    labelOrderDate: useUiText("checkout", "label_order_date", "Fecha:"),
    labelTransactionId: useUiText("checkout", "label_transaction_id", "ID de Transacción PayPal:"),
    customerInfoTitle: useUiText("checkout", "customer_info_title", "Información del Cliente"),
    labelCustomerName: useUiText("checkout", "label_customer_name", "Nombre: "),
    labelCustomerEmail: useUiText("checkout", "label_customer_email", "Email: "),
    labelShippingAddressInfo: useUiText("checkout", "label_shipping_address_info", "Dirección de Envío: "),
    orderItemsTitle: useUiText("checkout", "order_items_title", "Artículos del Pedido"),
    badgeDigital: useUiText("checkout", "badge_digital", "Digital"),
    labelQuantityValue: useUiText("checkout", "label_quantity_value", "Cantidad: "),
    labelUnitPrice: useUiText("checkout", "label_unit_price", "Precio unitario: "),
    buttonDownloadPrefix: useUiText("checkout", "button_download_prefix", "Descargar"),
    fallbackFile: useUiText("checkout", "fallback_file", "Archivo"),
    downloadValidUntil: useUiText("checkout", "download_valid_until", "Link válido hasta "),
    downloadPendingMessage: useUiText("checkout", "download_pending_message", "El enlace de descarga estará disponible cuando se complete el pedido"),
    labelOrderTotal: useUiText("checkout", "label_order_total", "Total:"),
    nextStepsTitle: useUiText("checkout", "next_steps_title", "Próximos Pasos"),
    nextStepsMessage: useUiText("checkout", "next_steps_message", "Recibirás un correo electrónico de confirmación con los detalles de tu pedido. Si tu pedido incluye productos digitales, encontrarás los enlaces de descarga en el correo."),
    buttonMyOrders: useUiText("checkout", "button_my_orders", "Ver Mis Pedidos"),
    buttonDownloadInvoice: useUiText("checkout", "button_download_invoice", "Descargar Factura"),
    notAvailable: useUiText("checkout", "not_available", "N/A"),
  };

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

  const orderItems = order?.items ? JSON.parse(order.items) : [];
  const bookIds = orderItems
    .filter((item: any) => item.productType === 'book')
    .map((item: any) => item.productId);

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
                <CardTitle data-testid="text-error-title">{t.orderNotFoundTitle}</CardTitle>
                <CardDescription data-testid="text-error-description">
                  {t.orderNotFoundDesc}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground" data-testid="text-error-message">
              {t.orderNotFoundMessage}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                {t.buttonRetry}
              </Button>
              <Link href="/">
                <Button data-testid="button-home">
                  <Home className="h-4 w-4 mr-2" />
                  {t.buttonBackHome}
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
      pending: { variant: "secondary", label: t.statusPending },
      completed: { variant: "default", label: t.statusCompleted },
      failed: { variant: "destructive", label: t.statusFailed },
      cancelled: { variant: "outline", label: t.statusCancelled },
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t.notAvailable;
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
              {t.orderConfirmedTitle}
            </CardTitle>
            <CardDescription className="text-base mt-2" data-testid="text-confirmation-subtitle">
              {t.orderConfirmedSubtitle}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2" data-testid="section-order-info">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" data-testid="label-order-number">{t.labelOrderNumber}</span>
              <span className="font-mono font-semibold" data-testid="text-order-number">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" data-testid="label-order-status">{t.labelOrderStatus}</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" data-testid="label-order-date">{t.labelOrderDate}</span>
              <span className="text-sm" data-testid="text-order-date">{formatDate(order.createdAt)}</span>
            </div>
            {order.paypalOrderId && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" data-testid="label-transaction-id">{t.labelTransactionId}</span>
                <span className="text-sm font-mono" data-testid="text-transaction-id">{order.paypalOrderId}</span>
              </div>
            )}
          </div>

          <Separator />

          <div data-testid="section-customer-info">
            <h3 className="font-semibold mb-3" data-testid="text-customer-info-title">{t.customerInfoTitle}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground" data-testid="label-customer-name">{t.labelCustomerName}</span>
                <span data-testid="text-customer-name">{order.customerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground" data-testid="label-customer-email">{t.labelCustomerEmail}</span>
                <span data-testid="text-customer-email">{order.customerEmail}</span>
              </div>
              {shippingAddress && (
                <div>
                  <span className="text-muted-foreground" data-testid="label-shipping-address">{t.labelShippingAddressInfo}</span>
                  <span data-testid="text-shipping-address">{shippingAddress}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div data-testid="section-order-items">
            <h3 className="font-semibold mb-3" data-testid="text-items-title">{t.orderItemsTitle}</h3>
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
                              {t.badgeDigital}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-item-quantity-${index}`}>
                          {t.labelQuantityValue}{item.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-item-price-${index}`}>
                          {t.labelUnitPrice}{exchangeRates ? formatPriceWithConversionSync(
                            Math.round((item.price || 0) * 100),
                            currency,
                            locale,
                            exchangeRates
                          ) : '...'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-item-subtotal-${index}`}>
                          {exchangeRates ? formatPriceWithConversionSync(
                            Math.round(((item.price || 0) * item.quantity) * 100),
                            currency,
                            locale,
                            exchangeRates
                          ) : '...'}
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
                            {t.buttonDownloadPrefix} {(() => {
                              try {
                                if (book?.digitalFiles) {
                                  const formats = JSON.parse(book.digitalFiles);
                                  return Object.keys(formats).map(f => f.toUpperCase()).join('/');
                                }
                              } catch {}
                              return t.fallbackFile;
                            })()}
                          </a>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center" data-testid={`text-expiration-${item.productId}`}>
                          {t.downloadValidUntil}{formatExpirationDate(downloadToken.expiresAt)}
                        </p>
                      </div>
                    )}
                    {isDigital && !downloadToken && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                        {t.downloadPendingMessage}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center text-lg font-bold" data-testid="section-total">
            <span data-testid="label-total">{t.labelOrderTotal}</span>
            <span data-testid="text-total">{exchangeRates ? formatPriceWithConversionSync(
              Math.round(order.totalAmount * 100),
              currency,
              locale,
              exchangeRates
            ) : '...'}</span>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4" data-testid="section-next-steps">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2" data-testid="text-next-steps-title">
              {t.nextStepsTitle}
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="text-next-steps-message">
              {t.nextStepsMessage}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                <Home className="h-4 w-4 mr-2" />
                {t.buttonBackHome}
              </Button>
            </Link>
            {user && (
              <Link href="/mis-pedidos" className="flex-1">
                <Button variant="outline" className="w-full" data-testid="button-my-orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {t.buttonMyOrders}
                </Button>
              </Link>
            )}
            <Button variant="outline" className="flex-1" disabled data-testid="button-download-invoice">
              <FileText className="h-4 w-4 mr-2" />
              {t.buttonDownloadInvoice}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
