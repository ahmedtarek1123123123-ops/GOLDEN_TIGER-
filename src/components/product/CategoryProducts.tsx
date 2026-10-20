'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { useI18n } from '@/context/I18nContext';
import type { Product } from '@/types';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'top-rated';

export function CategoryProducts({
  products,
  page,
  totalPages,
  total,
}: {
  products: Product[];
  page: number;
  totalPages: number;
  total: number;
}) {
  const { t } = useI18n();
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const SORT_LABELS: Record<SortOption, string> = {
    featured: t('category.sort.featured'),
    'price-low': t('category.sort.priceLow'),
    'price-high': t('category.sort.priceHigh'),
    'top-rated': t('category.sort.topRated'),
  };

  const sorted = useMemo(() => {
    const copy = [...products];
    switch (sortBy) {
      case 'price-low':
        return copy.sort((a, b) => a.price - b.price);
      case 'price-high':
        return copy.sort((a, b) => b.price - a.price);
      case 'top-rated':
        return copy.sort((a, b) => b.rating - a.rating);
      default:
        return copy;
    }
  }, [products, sortBy]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{t('category.productsCount', { count: total })}</p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted">
            {t('category.sortLabel')}
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text focus-ring cursor-pointer"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {sorted.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sponsored={product.isSponsored}
            source="category"
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text hover:border-gold/40 transition-colors"
            >
              {t('common.previous')}
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-muted px-1">&hellip;</span>
                )}
                <Link
                  href={`?page=${p}`}
                  className={`min-w-[2.5rem] h-10 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    p === page
                      ? 'gold-button'
                      : 'bg-surface-elevated border border-border text-text hover:border-gold/40'
                  }`}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text hover:border-gold/40 transition-colors"
            >
              {t('common.next')}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
