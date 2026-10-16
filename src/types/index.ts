export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  previous_price?: number | null;
  category_id: string;
  category_name?: string;
  stock: number;
  image_path: string;
  affiliate_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_path?: string;
  is_active: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ClickEventType = 'shopee_click' | 'shopee_redirect' | 'view_product';

export interface ClickEvent {
  id: string;
  product_id: string;
  product_name?: string;
  event_type: ClickEventType;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ConfirmedOrder {
  id: string;
  customer_name?: string;
  source: 'shopee_manual' | 'manual_admin' | 'external_import';
  status: 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  commission_earned?: number;
  notes?: string;
  created_at: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalShopeeClicks: number;
  totalOrders: number;
  totalConfirmedSalesAmount: number;
  lowStockProductsCount: number;
  outOfStockProductsCount: number;
}

export interface AdminSession {
  token: string;
  authenticatedAt: string;
  expiresAt: string;
}
