/**
 * Product types shared across the app. Data access lives in `lib/db.ts`
 * (SQLite) and `lib/backend.ts` (adds the artificial latency).
 */
export const TOTAL_PRODUCTS = 2500;

export interface ProductListItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  thumbnail: string;
  shortDescription: string;
  inStock: boolean;
}

export interface ProductReview {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  helpfulCount: number;
}

export interface ProductSpec {
  group: string;
  label: string;
  value: string;
}

export interface ProductDetail extends ProductListItem {
  description: string[];
  gallery: string[];
  features: string[];
  specs: ProductSpec[];
  reviews: ProductReview[];
  relatedIds: number[];
  sku: string;
  warranty: string;
  weightKg: number;
  dimensions: string;
}

export interface ProductsPage {
  items: ProductListItem[];
  nextCursor: number | null;
  total: number;
}
