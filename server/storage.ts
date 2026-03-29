import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, like, and, sql } from "drizzle-orm";
import {
  categories,
  products,
  cartItems,
  reviews,
  orders,
  orderItems,
  type Category,
  type Product,
  type CartItem,
  type InsertCartItem,
  type Review,
  type InsertReview,
  type Order,
  type InsertOrder,
  type InsertOrderItem,
} from "../shared/schema";
import { runSeed } from "./seed";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);

// Run migrations / create tables via drizzle push or inline
// Create tables if they don't exist using raw SQL (for convenience in dev)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    price REAL NOT NULL,
    compare_at_price REAL,
    image_url TEXT,
    images TEXT,
    category_id INTEGER REFERENCES categories(id),
    brand TEXT,
    sku TEXT,
    in_stock INTEGER DEFAULT 1,
    stock_quantity INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    tags TEXT,
    ingredients TEXT,
    dosage TEXT,
    weight TEXT,
    featured INTEGER DEFAULT 0,
    badge TEXT,
    form_factor TEXT,
    country_of_origin TEXT,
    quantity_per_pack TEXT
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_amount REAL NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_method TEXT NOT NULL,
    delivery_address TEXT,
    cdek_city TEXT,
    cdek_point TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price REAL NOT NULL
  );
`);

// Seed if empty
const categoryCount = sqlite.prepare("SELECT COUNT(*) as cnt FROM categories").get() as { cnt: number };
if (categoryCount.cnt === 0) {
  runSeed(db);
}

export interface IStorage {
  getCategories(): Category[];
  getCategoryBySlug(slug: string): Category | undefined;
  getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Product[];
  getProductBySlug(slug: string): Product | undefined;
  getProductById(id: number): Product | undefined;
  getFeaturedProducts(): Product[];
  getCartItems(sessionId: string): (CartItem & { product: Product })[];
  addToCart(item: InsertCartItem): CartItem;
  updateCartItemQuantity(id: number, quantity: number): CartItem | undefined;
  removeCartItem(id: number): void;
  clearCart(sessionId: string): void;
  getReviews(productId: number): Review[];
  createReview(review: InsertReview): Review;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Order;
  getOrder(id: number): Order | undefined;
}

export class DatabaseStorage implements IStorage {
  getCategories(): Category[] {
    return db.select().from(categories).all();
  }

  getCategoryBySlug(slug: string): Category | undefined {
    return db.select().from(categories).where(eq(categories.slug, slug)).get();
  }

  getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Product[] {
    const conditions = [];

    if (filters?.categoryId !== undefined) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.featured !== undefined) {
      conditions.push(eq(products.featured, filters.featured));
    }

    if (filters?.search) {
      conditions.push(like(products.name, `%${filters.search}%`));
    }

    let query = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    if (filters?.limit !== undefined) {
      query = query.limit(filters.limit) as typeof query;
    }

    if (filters?.offset !== undefined) {
      query = query.offset(filters.offset) as typeof query;
    }

    return query.all();
  }

  getProductBySlug(slug: string): Product | undefined {
    return db.select().from(products).where(eq(products.slug, slug)).get();
  }

  getProductById(id: number): Product | undefined {
    return db.select().from(products).where(eq(products.id, id)).get();
  }

  getFeaturedProducts(): Product[] {
    return db.select().from(products).where(eq(products.featured, true)).all();
  }

  getCartItems(sessionId: string): (CartItem & { product: Product })[] {
    const items = db
      .select()
      .from(cartItems)
      .where(eq(cartItems.sessionId, sessionId))
      .all();

    const result: (CartItem & { product: Product })[] = [];

    for (const item of items) {
      const product = db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .get();

      if (product) {
        result.push({ ...item, product });
      }
    }

    return result;
  }

  addToCart(item: InsertCartItem): CartItem {
    // Check if same product already in cart for this session
    const existing = db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.sessionId, item.sessionId),
          eq(cartItems.productId, item.productId)
        )
      )
      .get();

    if (existing) {
      const newQuantity = existing.quantity + (item.quantity ?? 1);
      const updated = db
        .update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existing.id))
        .returning()
        .get();
      return updated!;
    }

    const inserted = db
      .insert(cartItems)
      .values(item)
      .returning()
      .get();

    return inserted!;
  }

  updateCartItemQuantity(id: number, quantity: number): CartItem | undefined {
    const updated = db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning()
      .get();

    return updated;
  }

  removeCartItem(id: number): void {
    db.delete(cartItems).where(eq(cartItems.id, id)).run();
  }

  clearCart(sessionId: string): void {
    db.delete(cartItems).where(eq(cartItems.sessionId, sessionId)).run();
  }

  getReviews(productId: number): Review[] {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .all();
  }

  createReview(review: InsertReview): Review {
    const inserted = db.insert(reviews).values(review).returning().get();

    // Update product rating and review count
    const allReviews = db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, review.productId))
      .all();

    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    db.update(products)
      .set({
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      })
      .where(eq(products.id, review.productId))
      .run();

    return inserted!;
  }

  createOrder(order: InsertOrder, items: InsertOrderItem[]): Order {
    const insertedOrder = db.insert(orders).values(order).returning().get();

    for (const item of items) {
      db.insert(orderItems)
        .values({ ...item, orderId: insertedOrder!.id })
        .run();
    }

    // Clear the cart after order is placed
    db.delete(cartItems)
      .where(eq(cartItems.sessionId, order.sessionId))
      .run();

    return insertedOrder!;
  }

  getOrder(id: number): Order | undefined {
    return db.select().from(orders).where(eq(orders.id, id)).get();
  }
}

export const storage = new DatabaseStorage();
