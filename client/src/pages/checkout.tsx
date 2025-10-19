import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCustomerSchema, type Customer, type InsertOrder, type EditorialSettings } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/use-analytics";
import { Loader2, ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import PayPalButton from "@/components/PayPalButton";
import { SEOHead } from "@/components/seo/seo-head";
import { formatPriceWithConversionSync } from "@shared/currency-service";
import { useUiText } from "@/contexts/ui-text-context";
import { useLocale } from "@/contexts/locale-context";

export default function Checkout() {
  const { items, isLoading: cartLoading, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { trackConversion } = useAnalytics();
  const { locale, currency, exchangeRates } = useLocale();
  const [, navigate] = useLocation();
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [preparingPayment, setPreparingPayment] = useState(false);

  const { data: settings } = useQuery<EditorialSettings>({
    queryKey: ["/api/editorial-settings"],
  });

  const t = {
    validationEmailInvalid: useUiText("checkout", "validation_email_invalid", "Email inválido"),
    validationFullnameRequired: useUiText("checkout", "validation_fullname_required", "El nombre completo es requerido"),
    validationBillingRequired: useUiText("checkout", "validation_billing_required", "La dirección de facturación es requerida"),
    errorVerifyCustomer: useUiText("checkout", "error_verify_customer", "Error al verificar cliente"),
    toastOrderCompletedTitle: useUiText("checkout", "toast_order_completed_title", "¡Pedido completado!"),
    toastOrderCompletedDesc: useUiText("checkout", "toast_order_completed_desc", "Tu pedido ha sido procesado exitosamente."),
    toastErrorTitle: useUiText("checkout", "toast_error_title", "Error"),
    toastOrderCreateError: useUiText("checkout", "toast_order_create_error", "No se pudo crear el pedido. Por favor, contacta con soporte."),
    toastExistingCustomerTitle: useUiText("checkout", "toast_existing_customer_title", "Cliente existente"),
    toastExistingCustomerDesc: useUiText("checkout", "toast_existing_customer_desc", "Tus datos han sido cargados automáticamente."),
    toastDataSavedTitle: useUiText("checkout", "toast_data_saved_title", "Datos guardados"),
    toastDataSavedDesc: useUiText("checkout", "toast_data_saved_desc", "Tu información ha sido registrada correctamente."),
    toastProcessError: useUiText("checkout", "toast_process_error", "No se pudo procesar la información. Por favor, intenta de nuevo."),
    toastQuantityUpdatedTitle: useUiText("checkout", "toast_quantity_updated_title", "Cantidad actualizada"),
    toastQuantityUpdatedDesc: useUiText("checkout", "toast_quantity_updated_desc", "El carrito ha sido actualizado."),
    toastQuantityUpdateError: useUiText("checkout", "toast_quantity_update_error", "No se pudo actualizar la cantidad."),
    toastProductRemovedTitle: useUiText("checkout", "toast_product_removed_title", "Producto eliminado"),
    toastProductRemovedDesc: useUiText("checkout", "toast_product_removed_desc", "El producto ha sido eliminado del carrito."),
    toastProductRemoveError: useUiText("checkout", "toast_product_remove_error", "No se pudo eliminar el producto."),
    emptyCartTitle: useUiText("checkout", "empty_cart_title", "Carrito Vacío"),
    emptyCartDesc: useUiText("checkout", "empty_cart_desc", "No tienes productos en tu carrito"),
    buttonBackToStore: useUiText("checkout", "button_back_to_store", "Volver a la tienda"),
    seoTitle: useUiText("checkout", "seo_title", "Checkout - Finalizar Compra"),
    seoDescription: useUiText("checkout", "seo_description", "Completa tu compra de forma segura. Revisa tu carrito, ingresa tu información de facturación y envío, y procede al pago."),
    seoKeywordCheckout: useUiText("checkout", "seo_keyword_checkout", "checkout"),
    seoKeywordBuy: useUiText("checkout", "seo_keyword_buy", "comprar"),
    seoKeywordPayment: useUiText("checkout", "seo_keyword_payment", "pago"),
    seoKeywordCart: useUiText("checkout", "seo_keyword_cart", "carrito"),
    seoKeywordComplete: useUiText("checkout", "seo_keyword_complete", "finalizar compra"),
    pageTitle: useUiText("checkout", "page_title", "Finalizar Compra"),
    cartSummaryTitle: useUiText("checkout", "cart_summary_title", "Resumen del Carrito"),
    cartSummaryDesc: useUiText("checkout", "cart_summary_desc", "Revisa tus productos antes de finalizar"),
    labelItemSubtotal: useUiText("checkout", "label_item_subtotal", "Subtotal:"),
    labelSubtotal: useUiText("checkout", "label_subtotal", "Subtotal:"),
    labelTax: useUiText("checkout", "label_tax", "Impuestos:"),
    labelTotal: useUiText("checkout", "label_total", "Total:"),
    billingFormTitle: useUiText("checkout", "billing_form_title", "Información de Facturación"),
    billingFormDesc: useUiText("checkout", "billing_form_desc", "Completa tus datos para continuar"),
    labelFullname: useUiText("checkout", "label_fullname", "Nombre Completo *"),
    placeholderFullname: useUiText("checkout", "placeholder_fullname", "Juan Pérez"),
    labelEmail: useUiText("checkout", "label_email", "Email *"),
    placeholderEmail: useUiText("checkout", "placeholder_email", "juan@ejemplo.com"),
    labelPhone: useUiText("checkout", "label_phone", "Teléfono"),
    placeholderPhone: useUiText("checkout", "placeholder_phone", "+1234567890"),
    labelBillingAddress: useUiText("checkout", "label_billing_address", "Dirección de Facturación *"),
    placeholderBillingAddress: useUiText("checkout", "placeholder_billing_address", "Calle, número, ciudad, código postal, país"),
    labelSameAsBilling: useUiText("checkout", "label_same_as_billing", "Dirección de envío igual a facturación"),
    labelShippingAddress: useUiText("checkout", "label_shipping_address", "Dirección de Envío"),
    placeholderShippingAddress: useUiText("checkout", "placeholder_shipping_address", "Calle, número, ciudad, código postal, país"),
    labelNewsletter: useUiText("checkout", "label_newsletter", "Suscribirme al boletín de noticias"),
    labelNewsletterDesc: useUiText("checkout", "label_newsletter_desc", "Recibe novedades y ofertas exclusivas"),
    buttonValidating: useUiText("checkout", "button_validating", "Validando..."),
    buttonContinuePayment: useUiText("checkout", "button_continue_payment", "Continuar al Pago"),
    paypalSecureMessage: useUiText("checkout", "paypal_secure_message", "Completa tu pago de forma segura con PayPal"),
    buttonConfirmOrder: useUiText("checkout", "button_confirm_order", "Confirmar Pedido"),
    fallbackProductName: useUiText("checkout", "fallback_product_name", "Producto"),
  };

  const checkoutFormSchema = insertCustomerSchema.extend({
    email: z.string().email(t.validationEmailInvalid),
    fullName: z.string().min(2, t.validationFullnameRequired),
    phone: z.string().optional(),
    billingAddress: z.string().min(10, t.validationBillingRequired),
    shippingAddress: z.string().optional(),
    isSubscribedToNewsletter: z.boolean().default(false),
    sameAsShipping: z.boolean().default(true),
  });

  type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      billingAddress: "",
      shippingAddress: "",
      isSubscribedToNewsletter: false,
      sameAsShipping: true,
    },
  });

  const sameAsShipping = form.watch("sameAsShipping");

  const checkCustomerMutation = useMutation<Customer | null, Error, string>({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/customers/email/${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error(t.errorVerifyCustomer);
      return await response.json() as Customer | null;
    },
  });

  const createCustomerMutation = useMutation<Customer, Error, CheckoutFormData>({
    mutationFn: async (data: CheckoutFormData) => {
      const customerData = {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || null,
        billingAddress: data.billingAddress,
        shippingAddress: data.sameAsShipping ? data.billingAddress : (data.shippingAddress || null),
        isSubscribedToNewsletter: data.isSubscribedToNewsletter,
      };
      const result = await apiRequest("POST", "/api/customers", customerData);
      return result as unknown as Customer;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: InsertOrder) => {
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: async (order: any) => {
      setOrderCreated(true);
      clearCart();
      
      await trackConversion("purchase", order.id, {
        orderId: order.id,
        revenue: totalPrice,
        currency: "USD",
        items: items.length,
        customerEmail: customerData?.email
      });
      
      toast({
        title: t.toastOrderCompletedTitle,
        description: t.toastOrderCompletedDesc,
      });

      setTimeout(() => {
        navigate(`/pedido/${order.id}`);
      }, 1000);
    },
    onError: () => {
      toast({
        title: t.toastErrorTitle,
        description: t.toastOrderCreateError,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setPreparingPayment(true);

      const existingCustomer = await checkCustomerMutation.mutateAsync(data.email);

      let customer: Customer;
      if (existingCustomer) {
        customer = existingCustomer;
        toast({
          title: t.toastExistingCustomerTitle,
          description: t.toastExistingCustomerDesc,
        });
      } else {
        customer = await createCustomerMutation.mutateAsync(data);
        toast({
          title: t.toastDataSavedTitle,
          description: t.toastDataSavedDesc,
        });
      }

      setCustomerData(customer);
      setPreparingPayment(false);

    } catch (error) {
      setPreparingPayment(false);
      toast({
        title: t.toastErrorTitle,
        description: t.toastProcessError,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (customerData && !orderCreated) {
      const checkPaymentInterval = setInterval(() => {
        const paypalCompleted = localStorage.getItem('paypal_payment_completed');
        
        if (paypalCompleted === 'true') {
          clearInterval(checkPaymentInterval);
          localStorage.removeItem('paypal_payment_completed');
          createOrder();
        }
      }, 1000);

      return () => clearInterval(checkPaymentInterval);
    }
  }, [customerData, orderCreated]);

  const createOrder = () => {
    if (!customerData) return;

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    const orderItems = items.map(item => ({
      id: item.id,
      productType: item.productType,
      productId: item.productId,
      quantity: item.quantity,
      price: item.book?.price || item.merchandise?.price || 0,
      name: item.book?.title || item.merchandise?.title || t.fallbackProductName,
    }));

    const orderData: InsertOrder = {
      orderNumber,
      paypalOrderId: null,
      paypalPayerId: null,
      totalAmount: totalPrice,
      status: "pending",
      customerId: customerData.id,
      customerName: customerData.fullName,
      customerEmail: customerData.email,
      shippingAddress: customerData.shippingAddress || customerData.billingAddress || null,
      items: JSON.stringify(orderItems),
    };

    createOrderMutation.mutate(orderData);
  };

  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    
    try {
      await updateQuantity(itemId, newQuantity);
      toast({
        title: t.toastQuantityUpdatedTitle,
        description: t.toastQuantityUpdatedDesc,
      });
    } catch (error) {
      toast({
        title: t.toastErrorTitle,
        description: t.toastQuantityUpdateError,
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      toast({
        title: t.toastProductRemovedTitle,
        description: t.toastProductRemovedDesc,
      });
    } catch (error) {
      toast({
        title: t.toastErrorTitle,
        description: t.toastProductRemoveError,
        variant: "destructive",
      });
    }
  };

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              {t.emptyCartTitle}
            </CardTitle>
            <CardDescription>
              {t.emptyCartDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.buttonBackToStore}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = totalPrice;
  const tax = 0;
  const total = subtotal + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title={t.seoTitle}
        description={t.seoDescription}
        keywords={[t.seoKeywordCheckout, t.seoKeywordBuy, t.seoKeywordPayment, t.seoKeywordCart, t.seoKeywordComplete]}
        ogType="website"
      />
      <h1 className="text-3xl font-bold mb-8" data-testid="text-checkout-title">{t.pageTitle}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card data-testid="card-cart-summary">
            <CardHeader>
              <CardTitle>{t.cartSummaryTitle}</CardTitle>
              <CardDescription>{t.cartSummaryDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const product = item.book || item.merchandise;
                const price = item.book?.price || item.merchandise?.price || 0;
                const subtotal = price * item.quantity;

                return (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-4 border rounded-lg"
                    data-testid={`cart-item-${item.id}`}
                  >
                    {(item.book?.coverImage || item.merchandise?.imageUrl) && (
                      <img
                        src={(item.book?.coverImage || item.merchandise?.imageUrl) ?? ""}
                        alt={item.book?.title || item.merchandise?.title || ""}
                        className="w-20 h-20 object-cover rounded"
                        data-testid={`img-product-${item.id}`}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold" data-testid={`text-product-name-${item.id}`}>
                        {item.book?.title || item.merchandise?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid={`text-product-price-${item.id}`}>
                        {exchangeRates ? formatPriceWithConversionSync(
                          Math.round(price * 100), // Convert to cents
                          currency,
                          locale,
                          exchangeRates
                        ) : '...'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                          disabled={item.quantity <= 1}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold mt-2" data-testid={`text-subtotal-${item.id}`}>
                        {t.labelItemSubtotal} {exchangeRates ? formatPriceWithConversionSync(
                          Math.round(subtotal * 100), // Convert to cents
                          currency,
                          locale,
                          exchangeRates
                        ) : '...'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span data-testid="text-subtotal-label">{t.labelSubtotal}</span>
                  <span data-testid="text-subtotal-value">{exchangeRates ? formatPriceWithConversionSync(
                    Math.round(subtotal * 100), // Convert to cents
                    currency,
                    locale,
                    exchangeRates
                  ) : '...'}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span data-testid="text-tax-label">{t.labelTax}</span>
                    <span data-testid="text-tax-value">{exchangeRates ? formatPriceWithConversionSync(
                      Math.round(tax * 100), // Convert to cents
                      currency,
                      locale,
                      exchangeRates
                    ) : '...'}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span data-testid="text-total-label">{t.labelTotal}</span>
                  <span data-testid="text-total-value">{exchangeRates ? formatPriceWithConversionSync(
                    Math.round(total * 100), // Convert to cents
                    currency,
                    locale,
                    exchangeRates
                  ) : '...'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card data-testid="card-billing-form">
            <CardHeader>
              <CardTitle>{t.billingFormTitle}</CardTitle>
              <CardDescription>{t.billingFormDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelFullname}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t.placeholderFullname}
                            {...field} 
                            data-testid="input-fullname"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelEmail}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder={t.placeholderEmail}
                            {...field} 
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelPhone}</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder={t.placeholderPhone}
                            {...field} 
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.labelBillingAddress}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t.placeholderBillingAddress}
                            {...field} 
                            data-testid="textarea-billing-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sameAsShipping"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-same-as-billing"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t.labelSameAsBilling}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!sameAsShipping && (
                    <FormField
                      control={form.control}
                      name="shippingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.labelShippingAddress}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.placeholderShippingAddress}
                              {...field} 
                              data-testid="textarea-shipping-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="isSubscribedToNewsletter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-newsletter"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {t.labelNewsletter}
                          </FormLabel>
                          <FormDescription>
                            {t.labelNewsletterDesc}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!customerData && (
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={preparingPayment || !form.formState.isValid}
                      data-testid="button-validate-order"
                    >
                      {preparingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.buttonValidating}
                        </>
                      ) : (
                        t.buttonContinuePayment
                      )}
                    </Button>
                  )}
                </form>
              </Form>

              {customerData && form.formState.isValid && !orderCreated && (
                <div className="mt-6 space-y-4" data-testid="paypal-section">
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.paypalSecureMessage}
                    </p>
                    <PayPalButton 
                      amount={total.toFixed(2)} 
                      currency={settings?.currency || "USD"} 
                      intent="CAPTURE"
                    />
                    <Button
                      onClick={createOrder}
                      className="w-full mt-4"
                      variant="outline"
                      data-testid="button-complete-order"
                    >
                      {t.buttonConfirmOrder}
                    </Button>
                  </div>
                </div>
              )}

              {orderCreated && (
                <div className="mt-6">
                  <p className="text-center text-green-600 font-semibold">{t.toastOrderCompletedTitle}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
