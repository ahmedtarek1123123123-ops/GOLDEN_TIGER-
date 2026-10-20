import 'server-only';
import type { Category, Product, HeroSlide } from '@/types';
import { supabase, isDatabaseConfigured } from '@/lib/db';
import { ensureDatabaseConfigured } from '@/lib/env';
import { mapCategoryRow, mapProductRow, type CategoryRow, type ProductRow } from './mappers';

export async function getCategoryTree(): Promise<Category[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) { console.error('[getCategoryTree] Supabase error:', error.message); return []; }
  if (!data) return [];
  const rows = data as CategoryRow[];
  const roots = rows.filter((c) => !c.parent_id);
  return roots.map((r) => mapCategoryRow(r, rows));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isDatabaseConfigured()) return null;
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) { console.error('[getCategoryBySlug] Supabase error:', error.message); return null; }
  if (!data) return null;
  const cat = data as CategoryRow;

  const { data: allCats } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return mapCategoryRow(cat, (allCats as CategoryRow[]) ?? []);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .filter('tags', 'cs', '{bestseller}')
    .order('rating', { ascending: false })
    .limit(8);

  if (error) { console.error('[getFeaturedProducts] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getProductsByCategory(
  slug: string,
  page: number = 1,
  pageSize: number = 24
): Promise<{ products: Product[]; total: number; page: number; pageSize: number }> {
  if (!isDatabaseConfigured()) return { products: [], total: 0, page, pageSize };
  ensureDatabaseConfigured();

  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!cat) return { products: [], total: 0, page, pageSize };

  const { data: subcats } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', cat.id);

  const categoryIds = [cat.id, ...((subcats ?? []).map((s: { id: string }) => s.id))];

  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;

  const { data, count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .in('category_id', categoryIds)
    .eq('is_published', true)
    .order('is_sponsored', { ascending: false })
    .order('ad_priority', { ascending: false })
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) { console.error('[getProductsByCategory] Supabase error:', error.message); return { products: [], total: 0, page, pageSize }; }
  if (!data) return { products: [], total: 0, page, pageSize };
  return { products: (data as ProductRow[]).map(mapProductRow), total: count ?? 0, page, pageSize };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isDatabaseConfigured()) return null;
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) { console.error('[getProductBySlug] Supabase error:', error.message); return null; }
  if (!data) return null;
  return mapProductRow(data as ProductRow);
}

export async function getRelatedProducts(productId: string): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data: product } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .maybeSingle();
  if (!product) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', productId)
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(8);

  if (error) { console.error('[getRelatedProducts] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const staticSlides: HeroSlide[] = [
    {
      id: 'slide-1',
      image: 'https://images.pexels.com/photos/16387546/pexels-photo-16387546.jpeg?auto=compress&cs=tinysrgb&h=800&w=1600',
      headline: 'Premium Electronics, Unbeatable Prices',
      subcopy: 'Discover the latest in audio, wearables, and computing technology.',
      ctaText: 'Shop Electronics',
      ctaHref: '/category/electronics',
    },
    {
      id: 'slide-2',
      image: 'https://images.pexels.com/photos/1488470/pexels-photo-1488470.jpeg?auto=compress&cs=tinysrgb&h=800&w=1600',
      headline: 'Elevate Your Style',
      subcopy: 'Curated fashion for every occasion, from casual to couture.',
      ctaText: 'Shop Fashion',
      ctaHref: '/category/fashion',
    },
    {
      id: 'slide-3',
      image: 'https://images.pexels.com/photos/7166645/pexels-photo-7166645.jpeg?auto=compress&cs=tinysrgb&h=800&w=1600',
      headline: 'Transform Your Home',
      subcopy: 'Premium kitchen appliances and decor for the modern home.',
      ctaText: 'Shop Home & Kitchen',
      ctaHref: '/category/home-kitchen',
    },
  ];

  if (!isDatabaseConfigured()) return staticSlides;
  ensureDatabaseConfigured();

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .eq('is_homepage_banner', true)
      .order('ad_priority', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) return staticSlides;

    const rows = data as ProductRow[];
    const now = new Date();
    const active = rows.filter((r) => {
      const start = r.ad_starts_at ? new Date(r.ad_starts_at) : null;
      const end = r.ad_ends_at ? new Date(r.ad_ends_at) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    });

    if (active.length === 0) return staticSlides;

    const adSlides: HeroSlide[] = active.map((p) => ({
      id: `ad-banner-${p.id}`,
      image:
        p.banner_image_url ||
        (p.images?.[0]
          ? p.images[0].replace('h=600&w=600', 'h=800&w=1600')
          : 'https://images.pexels.com/photos/16387546/pexels-photo-16387546.jpeg?auto=compress&cs=tinysrgb&h=800&w=1600'),
      headline: p.banner_headline || p.title,
      subcopy: p.banner_subtext || p.short_description || p.brand || '',
      ctaText: 'Shop Now',
      ctaHref: `/product/${p.slug}`,
      sponsored: true,
      productId: p.id,
    }));

    return [...adSlides, ...staticSlides];
  } catch {
    return staticSlides;
  }
}

export async function getHomepageRelatedProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('rating', { ascending: false })
    .limit(12);

  if (error) { console.error('[getHomepageRelatedProducts] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getAllProductSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('slug')
    .eq('is_published', true);

  if (error) { console.error('[getAllProductSlugs] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as { slug: string }[]).map((p) => p.slug);
}

export async function getDealsOfTheDay(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  ensureDatabaseConfigured();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .filter('tags', 'cs', '"{""deal""}"')
    .order('rating', { ascending: false })
    .limit(8);

  if (error) { console.error('[getDealsOfTheDay] Supabase error:', error.message); return []; }
  if (!data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}
