import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertCustomerSchema, type Customer, type InsertOrder } from "@shared/schema";
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

// Extend customer schema with proper validation
const checkoutFormSchema = insertCustomerSchema.extend({
  email: z.string().email("Email inválido"),
  fullName: z.string().min(2, "El nombre completo es requerido"),
  phone: z.string().optional(),
  billingAddress: z.string().min(10, "La dirección de facturación es requerida"),
  shippingAddress: z.string().optional(),
  isSubscribedToNewsletter: z.boolean().default(false),
  sameAsShipping: z.boolean().default(true),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
  const { items, isLoading: cartLoading, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { trackConversion } = useAnalytics();
  const [, navigate] = useLocation();
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [preparingPayment, setPreparingPayment] = useState(false);

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

  // Check customer mutation
  const checkCustomerMutation = useMutation<Customer | null, Error, string>({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/customers/email/${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error("Error al verificar cliente");
      return await response.json() as Customer | null;
    },
  });

  // Create customer mutation
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

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: InsertOrder) => {
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: async (order: any) => {
      setOrderCreated(true);
      // Clear cart after successful order
      clearCart();
      
      // Track purchase conversion
      await trackConversion("purchase", order.id, {
        orderId: order.id,
        revenue: totalPrice,
        currency: "USD",
        items: items.length,
        customerEmail: customerData?.email
      });
      
      toast({
        title: "¡Pedido completado!",
        description: "Tu pedido ha sido procesado exitosamente.",
      });

      // Redirect to order confirmation page
      setTimeout(() => {
        navigate(`/pedido/${order.id}`);
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el pedido. Por favor, contacta con soporte.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setPreparingPayment(true);

      // Check if customer exists
      const existingCustomer = await checkCustomerMutation.mutateAsync(data.email);

      let customer: Customer;
      if (existingCustomer) {
        customer = existingCustomer;
        toast({
          title: "Cliente existente",
          description: "Tus datos han sido cargados automáticamente.",
        });
      } else {
        // Create new customer
        customer = await createCustomerMutation.mutateAsync(data);
        toast({
          title: "Datos guardados",
          description: "Tu información ha sido registrada correctamente.",
        });
      }

      setCustomerData(customer);
      setPreparingPayment(false);

    } catch (error) {
      setPreparingPayment(false);
      toast({
        title: "Error",
        description: "No se pudo procesar la información. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Handle PayPal payment completion
  useEffect(() => {
    // This is a workaround since PayPalButton doesn't expose success callback
    // In production, the backend capture endpoint should create the order
    // For now, we'll create the order when customer data is ready and user has initiated payment
    
    if (customerData && !orderCreated) {
      // Listen for PayPal completion (simplified - in production this should be handled via backend)
      const checkPaymentInterval = setInterval(() => {
        // Check if PayPal payment was completed
        // This is a placeholder - actual implementation should verify payment status
        const paypalCompleted = localStorage.getItem('paypal_payment_completed');
        
        if (paypalCompleted === 'true') {
          clearInterval(checkPaymentInterval);
          localStorage.removeItem('paypal_payment_completed');
          
          // Create order after PayPal success
          createOrder();
        }
      }, 1000);

      return () => clearInterval(checkPaymentInterval);
    }
  }, [customerData, orderCreated]);

  const createOrder = () => {
    if (!customerData) return;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // Prepare order items
    const orderItems = items.map(item => ({
      id: item.id,
      productType: item.productType,
      productId: item.productId,
      quantity: item.quantity,
      price: item.book?.price || item.merchandise?.price || 0,
      name: item.book?.title || item.merchandise?.title || "Producto",
    }));

    const orderData: InsertOrder = {
      orderNumber,
      paypalOrderId: null, // Will be set by backend on PayPal capture
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

  // Handle quantity update
  const handleUpdateQuantity = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    
    try {
      await updateQuantity(itemId, newQuantity);
      toast({
        title: "Cantidad actualizada",
        description: "El carrito ha sido actualizado.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad.",
        variant: "destructive",
      });
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado del carrito.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
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
              Carrito Vacío
            </CardTitle>
            <CardDescription>
              No tienes productos en tu carrito
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la tienda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const subtotal = totalPrice;
  const tax = 0; // Optional tax calculation
  const total = subtotal + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <SEOHead
        title="Checkout - Finalizar Compra"
        description="Completa tu compra de forma segura. Revisa tu carrito, ingresa tu información de facturación y envío, y procede al pago."
        keywords={["checkout", "comprar", "pago", "carrito", "finalizar compra"]}
        ogType="website"
      />
      <h1 className="text-3xl font-bold mb-8" data-testid="text-checkout-title">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cart Summary Section */}
        <div className="space-y-4">
          <Card data-testid="card-cart-summary">
            <CardHeader>
              <CardTitle>Resumen del Carrito</CardTitle>
              <CardDescription>Revisa tus productos antes de finalizar</CardDescription>
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
                        ${price.toFixed(2)} USD
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
                        Subtotal: ${subtotal.toFixed(2)} USD
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
                  <span data-testid="text-subtotal-label">Subtotal:</span>
                  <span data-testid="text-subtotal-value">${subtotal.toFixed(2)} USD</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span data-testid="text-tax-label">Impuestos:</span>
                    <span data-testid="text-tax-value">${tax.toFixed(2)} USD</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span data-testid="text-total-label">Total:</span>
                  <span data-testid="text-total-value">${total.toFixed(2)} USD</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Form Section */}
        <div className="space-y-4">
          <Card data-testid="card-billing-form">
            <CardHeader>
              <CardTitle>Información de Facturación</CardTitle>
              <CardDescription>Completa tus datos para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Juan Pérez" 
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="juan@ejemplo.com" 
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
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1234567890" 
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
                        <FormLabel>Dirección de Facturación *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Calle, número, ciudad, código postal, país" 
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
                            Dirección de envío igual a facturación
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
                          <FormLabel>Dirección de Envío</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Calle, número, ciudad, código postal, país" 
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
                            Suscribirme al boletín de noticias
                          </FormLabel>
                          <FormDescription>
                            Recibe novedades y ofertas exclusivas
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
                          Validando...
                        </>
                      ) : (
                        "Continuar al Pago"
                      )}
                    </Button>
                  )}
                </form>
              </Form>

              {/* PayPal Button - shown after form validation */}
              {customerData && form.formState.isValid && !orderCreated && (
                <div className="mt-6 space-y-4" data-testid="paypal-section">
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Completa tu pago de forma segura con PayPal
                    </p>
                    <PayPalButton 
                      amount={total.toFixed(2)} 
                      currency="USD" 
                      intent="CAPTURE"
                    />
                    <Button
                      onClick={createOrder}
                      className="w-full mt-4"
                      variant="outline"
                      data-testid="button-complete-order"
                    >
                      Confirmar Pedido
                    </Button>
                  </div>
                </div>
              )}

              {orderCreated && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="order-success">
                  <p className="text-green-800 font-semibold">
                    ¡Pedido completado exitosamente!
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Redirigiendo...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
