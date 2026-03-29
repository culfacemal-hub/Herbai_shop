import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartItemSchema, insertReviewSchema, insertOrderSchema, insertOrderItemSchema } from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ─── Categories ────────────────────────────────────────────────

  // GET /api/categories
  app.get("/api/categories", (_req: Request, res: Response) => {
    try {
      const cats = storage.getCategories();
      res.json(cats);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper to extract session id from header
  const getSessionId = (req: Request): string | undefined => {
    const val = req.headers["x-session-id"];
    return Array.isArray(val) ? val[0] : val;
  };

  // GET /api/categories/:slug
  app.get("/api/categories/:slug", (req: Request, res: Response) => {
    try {
      const category = storage.getCategoryBySlug(String(req.params.slug));
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Products ──────────────────────────────────────────────────

  // GET /api/products?category=&search=&featured=&limit=&offset=
  app.get("/api/products", (req: Request, res: Response) => {
    try {
      const { category, search, featured, limit, offset } = req.query;

      const filters: Parameters<typeof storage.getProducts>[0] = {};

      if (category) {
        // category can be a slug or numeric id
        if (!isNaN(Number(category))) {
          filters.categoryId = Number(category);
        } else {
          const cat = storage.getCategoryBySlug(String(category));
          if (cat) {
            filters.categoryId = cat.id;
          }
        }
      }

      if (search) {
        filters.search = String(search);
      }

      if (featured !== undefined) {
        filters.featured = featured === "true" || featured === "1";
      }

      if (limit !== undefined && !isNaN(Number(limit))) {
        filters.limit = Number(limit);
      }

      if (offset !== undefined && !isNaN(Number(offset))) {
        filters.offset = Number(offset);
      }

      const prods = storage.getProducts(filters);
      res.json(prods);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products/:slug  (try slug first, then id)
  app.get("/api/products/:slug", (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug);
      let product = storage.getProductBySlug(slug);

      // Fallback to numeric id lookup
      if (!product && !isNaN(Number(slug))) {
        product = storage.getProductById(Number(slug));
      }

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Cart ──────────────────────────────────────────────────────

  // GET /api/cart
  app.get("/api/cart", (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      if (!sessionId) {
        return res.status(400).json({ message: "x-session-id header is required" });
      }
      const items = storage.getCartItems(sessionId);
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/cart  { productId, quantity }
  app.post("/api/cart", (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      if (!sessionId) {
        return res.status(400).json({ message: "x-session-id header is required" });
      }

      const bodySchema = z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1),
      });

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.issues });
      }

      const { productId, quantity } = parsed.data;

      // Verify product exists
      const product = storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const cartItem = storage.addToCart({ sessionId, productId, quantity });
      res.status(201).json(cartItem);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/cart/:id  { quantity }
  app.patch("/api/cart/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item id" });
      }

      const bodySchema = z.object({
        quantity: z.number().int().positive(),
      });

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.issues });
      }

      const updated = storage.updateCartItemQuantity(id, parsed.data.quantity);
      if (!updated) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/cart/:id
  app.delete("/api/cart/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item id" });
      }

      storage.removeCartItem(id);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/cart  (clear entire cart)
  app.delete("/api/cart", (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      if (!sessionId) {
        return res.status(400).json({ message: "x-session-id header is required" });
      }

      storage.clearCart(sessionId);
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Reviews ──────────────────────────────────────────────────

  // GET /api/products/:id/reviews
  app.get("/api/products/:id/reviews", (req: Request, res: Response) => {
    try {
      const productId = parseInt(String(req.params.id), 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      const product = storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const reviewList = storage.getReviews(productId);
      res.json(reviewList);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/products/:id/reviews
  app.post("/api/products/:id/reviews", (req: Request, res: Response) => {
    try {
      const productId = parseInt(String(req.params.id), 10);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      const product = storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const bodySchema = z.object({
        author: z.string().min(1),
        rating: z.number().int().min(1).max(5),
        text: z.string().optional(),
      });

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.issues });
      }

      const review = storage.createReview({
        productId,
        author: parsed.data.author,
        rating: parsed.data.rating,
        text: parsed.data.text ?? null,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json(review);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ─── Orders ───────────────────────────────────────────────────

  // POST /api/orders
  app.post("/api/orders", (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      if (!sessionId) {
        return res.status(400).json({ message: "x-session-id header is required" });
      }

      const orderSchema = z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(1),
        deliveryMethod: z.string().min(1),
        deliveryAddress: z.string().optional(),
        cdekCity: z.string().optional(),
        cdekPoint: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().positive(),
            price: z.number().positive(),
          })
        ).min(1),
      });

      const parsed = orderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request body", errors: parsed.error.issues });
      }

      const { items, ...orderFields } = parsed.data;

      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const orderData: InsertOrder = {
        sessionId,
        status: "pending",
        totalAmount,
        customerName: orderFields.customerName,
        customerEmail: orderFields.customerEmail,
        customerPhone: orderFields.customerPhone,
        deliveryMethod: orderFields.deliveryMethod,
        deliveryAddress: orderFields.deliveryAddress ?? null,
        cdekCity: orderFields.cdekCity ?? null,
        cdekPoint: orderFields.cdekPoint ?? null,
        createdAt: new Date().toISOString(),
      };

      const orderItemsData: InsertOrderItem[] = items.map((item) => ({
        orderId: 0, // will be set in createOrder
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const order = storage.createOrder(orderData, orderItemsData);
      res.status(201).json(order);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/orders/:id
  app.get("/api/orders/:id", (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order id" });
      }

      const order = storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

// Import types needed in routes
import type { InsertOrder, InsertOrderItem } from "../shared/schema";
