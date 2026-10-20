import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Chrome as Home } from 'lucide-react';
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
  getCategoryTree,
  getProductsByCategory,
} from '@/lib/data/products';
import { ProductGallery } from '@/components/product/ProductGallery';
import { BuyBox } from '@/components/product/BuyBox';
import { ProductTabs } from '@/components/product/ProductTabs';
import { ProductSlider } from '@/components/product/ProductSlider';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { LoyaltyRewards } from '@/components/product/LoyaltyRewards';
import { ProductReviews } from '@/components/product/ProductReviews';
import type { Product } from '@/types';

export const revalidate = 300;

interface ProductPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return { title: 'Product Not Found' };
  }
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images.slice(0, 1).map((url) => ({ url })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const [related, categories] = await Promise.all([
    getRelatedProducts(product.id),
    getCategoryTree(),
  ]);

  // Find category for breadcrumb
  const category = categories.find(
    (c) => c.id === product.categoryId || c.subcategories.some((s) => s.id === product.subcategoryId)
  );
  const subcategory = category?.subcategories.find((s) => s.id === product.subcategoryId);

  // Build all products list for RecentlyViewed
  const allProducts: Product[] = [];
  for (const cat of categories) {
    const { products: prods } = await getProductsByCategory(cat.slug);
    allProducts.push(...prods);
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted mb-6 flex-wrap">
        <Link href="/" className="hover:text-gold transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/category/${category.slug}`} className="hover:text-gold transition-colors">
              {category.name}
            </Link>
          </>
        )}
        {subcategory && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/category/${subcategory.slug}`} className="hover:text-gold transition-colors">
              {subcategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text font-medium truncate max-w-[200px]">{product.title}</span>
      </nav>

      {/* Main product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-10">
        <ProductGallery
          images={product.images}
          videoUrls={product.videoUrls}
          title={product.title}
        />
        <div className="space-y-6">
          <BuyBox product={product} />
          <LoyaltyRewards userPoints={0} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <ProductTabs product={product} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <ProductSlider
          title="Related Products"
          products={related}
          seeAllHref={category ? `/category/${category.slug}` : undefined}
        />
      )}

      {/* Customer Reviews */}
      <div className="mb-10">
        <ProductReviews productId={product.id} />
      </div>

      {/* Recently viewed */}
      <RecentlyViewed currentProductId={product.id} allProducts={allProducts} />
    </div>
  );
}
