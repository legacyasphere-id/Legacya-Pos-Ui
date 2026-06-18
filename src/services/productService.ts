import { supabase } from '../lib/supabaseClient';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.generated';

export type Product = Tables<'product'>;
export type ProductCategory = Tables<'product_category'>;
export type ProductInsert = TablesInsert<'product'>;
export type ProductUpdate = TablesUpdate<'product'>;

export type ProductWithCategory = Product & {
  product_category: Pick<ProductCategory, 'id' | 'name'> | null;
};

export interface ProductFilters {
  categoryId?: string;
  archived?: boolean;
  search?: string;
}

const PRODUCT_SELECT =
  'id, name, sku, barcode, description, price, cost_price, emoji, image_url, ' +
  'is_available, archived, track_inventory, sort_order, category_id, created_at, updated_at, ' +
  'product_category(id, name)';

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<ProductWithCategory[]> {
    let query = supabase.from('product').select(PRODUCT_SELECT);

    const showArchived = filters?.archived ?? false;
    query = query.eq('archived', showArchived);

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    query = query.order('sort_order').order('name');

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as ProductWithCategory[];
  },

  async getProduct(id: string): Promise<ProductWithCategory | null> {
    const { data, error } = await supabase
      .from('product')
      .select(PRODUCT_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as ProductWithCategory | null;
  },

  async createProduct(data: ProductInsert): Promise<Product> {
    const { data: created, error } = await supabase
      .from('product')
      .insert(data)
      .select(PRODUCT_SELECT)
      .single();
    if (error) throw error;
    return created as unknown as Product;
  },

  async updateProduct(id: string, data: ProductUpdate): Promise<Product> {
    const { data: updated, error } = await supabase
      .from('product')
      .update(data)
      .eq('id', id)
      .select(PRODUCT_SELECT)
      .single();
    if (error) throw error;
    return updated as unknown as Product;
  },

  async archiveProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('product')
      .update({ archived: true } satisfies ProductUpdate)
      .eq('id', id);
    if (error) throw error;
  },

  async searchProducts(query: string): Promise<ProductWithCategory[]> {
    const { data, error } = await supabase
      .from('product')
      .select(PRODUCT_SELECT)
      .eq('archived', false)
      .ilike('name', `%${query}%`)
      .order('sort_order')
      .order('name');
    if (error) throw error;
    return (data ?? []) as unknown as ProductWithCategory[];
  },
};
