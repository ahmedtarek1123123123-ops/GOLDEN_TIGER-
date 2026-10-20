import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getAdminSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('products')
      .select('id, slug, title, brand, sku, price_cents, compare_at_cents, stock, is_published, category_id, rating, review_count, tags, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category_id', category);
    }

    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('products')
      .insert({
        id: body.id ?? `p-${Date.now()}`,
        slug: body.slug,
        title: body.title,
        brand: body.brand ?? null,
        sku: body.sku ?? null,
        short_description: body.short_description ?? null,
        description: body.description ?? '',
        features: body.features ?? [],
        specifications: body.specifications ?? null,
        price_cents: body.price_cents,
        compare_at_cents: body.compare_at_cents ?? null,
        stock: body.stock ?? 0,
        images: body.images ?? [],
        video_urls: body.video_urls ?? [],
        tags: body.tags ?? [],
        is_published: body.is_published ?? true,
        category_id: body.category_id,
        seo_title: body.seo_title ?? null,
        seo_description: body.seo_description ?? null,
        seo_keywords: body.seo_keywords ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
