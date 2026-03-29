import { drizzle } from "drizzle-orm/better-sqlite3";
import { categories, products } from "../shared/schema";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

interface SeedCategory {
  name: string;
  slug: string;
  parentName: string | null;
  isChild: boolean;
}

interface SeedProduct {
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  shortDescription: string;
  description: string;
  badge: string | null;
  tags: string;
  brand: string;
  formFactor: string;
  countryOfOrigin: string;
  quantityPerPack: string;
  stockQuantity: number;
  inStock: boolean;
  images: string;
  imageUrl: string | null;
  categoryName: string;
  featured: boolean;
}

interface SeedData {
  categories: SeedCategory[];
  products: SeedProduct[];
}

export function runSeed(db: ReturnType<typeof drizzle>) {
  // Load data from JSON file
  const jsonPath = resolve(process.cwd(), "server", "seed-data.json");
  let data: SeedData;
  try {
    data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch {
    // Try alternative path (production build)
    const altPath = resolve(process.cwd(), "seed-data.json");
    try {
      data = JSON.parse(readFileSync(altPath, "utf-8"));
    } catch {
      console.error("Could not find seed-data.json");
      return;
    }
  }

  const categoryNameToId: Record<string, number> = {};
  const parentCatNames = new Set(
    data.categories.filter((c) => !c.isChild).map((c) => c.name)
  );

  // Insert parent categories first
  for (const cat of data.categories) {
    if (parentCatNames.has(cat.name)) {
      const result = db
        .insert(categories)
        .values({
          name: cat.name,
          slug: cat.slug,
          description: null,
          imageUrl: null,
          parentId: null,
        })
        .returning()
        .get();
      if (result) {
        categoryNameToId[cat.name] = result.id;
      }
    }
  }

  // Insert subcategories with parentId
  for (const cat of data.categories) {
    if (cat.isChild && cat.parentName) {
      const parentId = categoryNameToId[cat.parentName] ?? null;
      const result = db
        .insert(categories)
        .values({
          name: cat.name,
          slug: cat.slug,
          description: null,
          imageUrl: null,
          parentId,
        })
        .returning()
        .get();
      if (result) {
        categoryNameToId[cat.name] = result.id;
      }
    }
  }

  // Insert products
  for (const p of data.products) {
    const categoryId = categoryNameToId[p.categoryName] ?? null;

    db.insert(products)
      .values({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        shortDescription: p.shortDescription,
        description: p.description,
        badge: p.badge,
        tags: p.tags,
        brand: p.brand,
        formFactor: p.formFactor,
        countryOfOrigin: p.countryOfOrigin,
        quantityPerPack: p.quantityPerPack,
        stockQuantity: p.stockQuantity,
        inStock: p.inStock,
        images: p.images,
        imageUrl: p.imageUrl,
        categoryId,
        featured: p.featured,
        rating: Math.round((4 + Math.random()) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 120) + 5,
      })
      .run();
  }

  console.log(
    `Seeded ${data.categories.length} categories and ${data.products.length} products`
  );
}
