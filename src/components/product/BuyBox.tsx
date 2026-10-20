'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { Rating } from '@/components/ui/Rating';
import { PriceTag } from '@/components/ui/PriceTag';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { formatPrice } from '@/lib/pricing';
import { calculatePoints } from '@/lib/loyalty-points';
import { productToSnapshot, getStockVariant, discountPercent } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { trackAddToCart, trackViewContent } from '@/lib/fbpixel';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export function BuyBox({ product }: { product: Product }) {
  const { t, dir, locale } = useI18n();
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const stockVariant = getStockVariant(product.stock);
  const maxQty = Math.min(product.stock, 10);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stock === 0;
  const pointsEarned = calculatePoints(product.price * quantity);

  useEffect(() => {
    trackViewContent({
      contentIds: [product.id],
      contentName: product.title,
      value: product.price,
    });
  }, [product.id, product.title, product.price]);

  function handleAddToCart() {
    if (outOfStock) return;
    setAdding(true);
    addItem(productToSnapshot(product), quantity);
    trackAddToCart({
      contentIds: [product.id],
      contentName: product.title,
      value: product.price,
      quantity,
    });
    setTimeout(() => setAdding(false), 600);
    toast.success(`${product.title} ${t('product.addedToCart')}`);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addItem(productToSnapshot(product), quantity);
    router.push('/checkout');
  }

  // Delivery estimate
  const today = new Date();
  const standardDate = new Date(today);
  standardDate.setDate(today.getDate() + 5);
  const dateStr = standardDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-4">
      <div className={cn(dir === 'rtl' && 'text-right')}>
        <p className="text-xs uppercase tracking-wider text-gold mb-1">{product.brand}</p>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text leading-tight">
          {product.title}
        </h1>
      </div>

      <Rating rating={product.rating} reviewCount={product.reviewCount} size="md" />

      <div className="py-3 border-y border-border">
        <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
        {discount !== null && (
          <p className={cn('text-sm text-success mt-1', dir === 'rtl' && 'text-right')}>
            {t('product.youSave')} {formatPrice((product.compareAtPrice || 0) - product.price)} ({discount}% {t('product.off')})
          </p>
        )}
      </div>

      {/* Stock badge */}
      <div>
        {stockVariant === 'in' && (
          <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-success', dir === 'rtl' && 'flex-row-reverse')}>
            <span className="h-2 w-2 rounded-full bg-success" /> {t('product.inStock')}
          </span>
        )}
        {stockVariant === 'low' && (
          <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-amber-500', dir === 'rtl' && 'flex-row-reverse')}>
            <span className="h-2 w-2 rounded-full bg-amber-500" /> {t('product.lowStock', { n: product.stock })}
          </span>
        )}
        {stockVariant === 'out' && (
          <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-danger', dir === 'rtl' && 'flex-row-reverse')}>
            <span className="h-2 w-2 rounded-full bg-danger" /> {t('product.outOfStock')}
          </span>
        )}
      </div>

      {/* Quantity */}
      {!outOfStock && (
        <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
          <label className="text-sm text-muted" htmlFor="qty">{t('product.quantity')}</label>
          <QuantityStepper
            quantity={quantity}
            max={maxQty}
            onChange={setQuantity}
          />
          {quantity >= maxQty && (
            <span className="text-xs text-amber-500">{t('product.maxPerOrder', { n: maxQty })}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={cn('flex flex-col sm:flex-row gap-3', dir === 'rtl' && 'sm:flex-row-reverse')}>
        <button
          onClick={handleAddToCart}
          disabled={outOfStock || adding}
          className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 gold-button text-sm font-semibold"
          aria-label={t('product.addCart')}
        >
          {adding ? (
            <>
              <Zap className="h-4 w-4" />
              {t('product.added')}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {t('product.addCart')}
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 bg-surface-elevated border border-border text-sm font-semibold text-text hover:border-gold/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <Zap className="h-4 w-4 text-gold" />
          {t('product.buyNow')}
        </button>
      </div>

      {/* Delivery estimate */}
      <div className={cn('flex items-start gap-2 text-sm text-muted p-3 rounded-lg bg-surface-elevated', dir === 'rtl' && 'flex-row-reverse text-right')}>
        <Truck className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div>
          <p className="text-text">{t('product.freeDelivery')} <span className="font-medium">{dateStr}</span></p>
          <p className="text-xs mt-0.5">{t('product.orderWithin')}</p>
        </div>
      </div>

      {/* Loyalty Points Display */}
      <div className={cn('flex items-center gap-2 p-3 rounded-lg bg-gold/10 border border-gold/20', dir === 'rtl' && 'flex-row-reverse text-right')}>
        <Sparkles className="h-5 w-5 text-gold shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gold">
            {t('product.earnPoints', { n: pointsEarned.toLocaleString() })}
          </p>
          <p className="text-xs text-muted">
            {t('product.pointsRate')}
          </p>
        </div>
      </div>

      {/* Secure note */}
      <div className={cn('flex items-center gap-2 text-xs text-muted', dir === 'rtl' && 'flex-row-reverse')}>
        <ShieldCheck className="h-4 w-4 text-gold" />
        {t('product.secureTransaction')}
      </div>
    </div>
  );
}
