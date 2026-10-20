import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Chrome as Home } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { CategoryProducts } from '@/components/product/CategoryProducts';
import {
  getCategoryBySlug,
  getProductsByCategory,
} from '@/lib/data/products';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    return { title: 'Category Not Found' };
  }
  return {
    title: category.name,
    description: `Shop ${category.name} at The Golden Tiger - premium products at competitive prices.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    notFound();
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const { products, total, page: currentPage, pageSize } = await getProductsByCategory(params.slug, page);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted mb-4">
        <Link href="/" className="hover:text-gold transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text font-medium">{category.name}</span>
      </nav>

      {/* Banner */}
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden mb-6">
        <SafeImage
          src={category.image}
          alt={category.name}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="font-heading text-2xl sm:text-4xl font-bold text-text">
            {category.name}
          </h1>
          <p className="text-sm text-muted mt-1">
            {total} products available
          </p>
        </div>
      </div>

      {/* Subcategory chips */}
      {category.subcategories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {category.subcategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug}`}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-surface-elevated text-muted hover:text-gold hover:border-gold/40 border border-border transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <CategoryProducts
        products={products}
        page={currentPage}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}
