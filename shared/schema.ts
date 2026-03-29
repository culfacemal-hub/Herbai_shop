import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: integer("parent_id"),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: real("price").notNull(),
  compareAtPrice: real("compare_at_price"),
  imageUrl: text("image_url"),
  images: text("images"), // JSON array of image URLs
  categoryId: integer("category_id").references(() => categories.id),
  brand: text("brand"),
  sku: text("sku"),
  inStock: integer("in_stock", { mode: "boolean" }).default(true),
  stockQuantity: integer("stock_quantity").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  tags: text("tags"), // JSON array of tags
  ingredients: text("ingredients"),
  dosage: text("dosage"),
  weight: text("weight"),
  featured: integer("featured", { mode: "boolean" }).default(false),
  badge: text("badge"), // e.g. "new", "bestseller", "sale"
  formFactor: text("form_factor"), // Капсулы, Таблетки, etc.
  countryOfOrigin: text("country_of_origin"),
  quantityPerPack: text("quantity_per_pack"),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  text: text("text"),
  createdAt: text("created_at").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  status: text("status").notNull().default("pending"),
  totalAmount: real("total_amount").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryMethod: text("delivery_method").notNull(),
  deliveryAddress: text("delivery_address"),
  cdekCity: text("cdek_city"),
  cdekPoint: text("cdek_point"),
  createdAt: text("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// Types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
