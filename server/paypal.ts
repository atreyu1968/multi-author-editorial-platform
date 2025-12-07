// PayPal Integration - Based on blueprint:javascript_paypal
// Modified to read credentials from database instead of environment variables
// Security: Includes replay protection and order verification

import {
  Client,
  Environment,
  LogLevel,
  OAuthAuthorizationController,
  OrdersController,
} from "@paypal/paypal-server-sdk";
import { Request, Response } from "express";
import { storage } from "./storage";

// In-memory cache for pending PayPal orders (prevents replay attacks)
// Maps PayPal orderID to { amount, currency, createdAt, captured }
const pendingPayPalOrders = new Map<string, {
  amount: string;
  currency: string;
  createdAt: Date;
  captured: boolean;
  cartId?: string;
}>();

// Clean up old pending orders every hour (prevent memory leak)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const entries = Array.from(pendingPayPalOrders.entries());
  entries.forEach(([orderId, data]) => {
    if (data.createdAt < oneHourAgo) {
      pendingPayPalOrders.delete(orderId);
    }
  });
}, 60 * 60 * 1000);

/* PayPal Configuration Helper */

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
}

async function getPayPalConfig(): Promise<PayPalConfig> {
  const settings = await storage.getEditorialSettings();
  
  if (!settings) {
    throw new Error("Editorial settings not found");
  }

  // Fallback to environment variables if not configured in database
  const clientId = settings.paypalClientId || process.env.PAYPAL_CLIENT_ID;
  const clientSecret = settings.paypalClientSecret || process.env.PAYPAL_CLIENT_SECRET;
  const environment = (settings.paypalEnvironment as "sandbox" | "production") || "sandbox";

  if (!clientId) {
    throw new Error("PayPal Client ID not configured. Please configure it in Editorial Settings.");
  }
  if (!clientSecret) {
    throw new Error("PayPal Client Secret not configured. Please configure it in Editorial Settings.");
  }

  return { clientId, clientSecret, environment };
}

/* PayPal Client Factory */

async function createPayPalClient(): Promise<Client> {
  const config = await getPayPalConfig();
  
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: config.clientId,
      oAuthClientSecret: config.clientSecret,
    },
    timeout: 0,
    environment: config.environment === "production" ? Environment.Production : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.Info,
      logRequest: {
        logBody: true,
      },
      logResponse: {
        logHeaders: true,
      },
    },
  });
}

/* Token generation helpers */

export async function getClientToken() {
  const config = await getPayPalConfig();
  const client = await createPayPalClient();
  const oAuthController = new OAuthAuthorizationController(client);
  
  const auth = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");

  const { result } = await oAuthController.requestToken(
    {
      authorization: `Basic ${auth}`,
    },
    { intent: "sdk_init", response_type: "client_token" },
  );

  return result.accessToken;
}

/* Process transactions */

export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency, intent, cartId } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({
          error: "Invalid amount. Amount must be a positive number.",
        });
    }

    if (!currency) {
      return res
        .status(400)
        .json({ error: "Invalid currency. Currency is required." });
    }

    if (!intent) {
      return res
        .status(400)
        .json({ error: "Invalid intent. Intent is required." });
    }

    const client = await createPayPalClient();
    const ordersController = new OrdersController(client);

    const collect = {
      body: {
        intent: intent,
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency,
              value: amount,
            },
          },
        ],
      },
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.createOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    // Track the order for replay protection
    if (jsonResponse.id) {
      pendingPayPalOrders.set(jsonResponse.id, {
        amount: amount,
        currency: currency,
        createdAt: new Date(),
        captured: false,
        cartId: cartId,
      });
      console.log(`[PayPal] Order created: ${jsonResponse.id}, amount: ${currency} ${amount}`);
    }

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error: any) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: error.message || "Failed to create order." });
  }
}

export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    
    // Security: Check if this order was created by our system
    const pendingOrder = pendingPayPalOrders.get(orderID);
    
    if (!pendingOrder) {
      console.warn(`[PayPal] Unknown order capture attempt: ${orderID}`);
      // Still proceed - order might be created before server restart
      // But log it for monitoring
    }
    
    // Security: Prevent replay attacks - check if already captured
    if (pendingOrder?.captured) {
      console.warn(`[PayPal] Replay attack prevented: ${orderID} already captured`);
      return res.status(400).json({ 
        error: "This order has already been processed." 
      });
    }
    
    const client = await createPayPalClient();
    const ordersController = new OrdersController(client);
    
    const collect = {
      id: orderID,
      prefer: "return=minimal",
    };

    const { body, ...httpResponse } =
          await ordersController.captureOrder(collect);

    const jsonResponse = JSON.parse(String(body));
    const httpStatusCode = httpResponse.statusCode;

    // Mark as captured to prevent replays
    if (pendingOrder && httpStatusCode === 201) {
      pendingOrder.captured = true;
      console.log(`[PayPal] Order captured successfully: ${orderID}`);
    }

    res.status(httpStatusCode).json(jsonResponse);
  } catch (error: any) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: error.message || "Failed to capture order." });
  }
}

export async function loadPaypalDefault(req: Request, res: Response) {
  try {
    const clientToken = await getClientToken();
    res.json({
      clientToken,
    });
  } catch (error: any) {
    console.error("Failed to get client token:", error);
    res.status(500).json({ error: error.message || "Failed to get client token." });
  }
}
