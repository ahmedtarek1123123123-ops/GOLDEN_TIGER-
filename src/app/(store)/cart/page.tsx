'use client';

import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowLeft, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/context/I18nContext';
import { formatPrice, computePriceBreakdown, DELIVERY_METHODS } from '@/lib/pricing';
import { SafeImage } from '@/components/ui/SafeImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { items, hydrated, removeItem, incrementItem, decrementItem, updateQuantity } = useCart();
  const { t, dir } = useI18n();
  const BackIcon = dir === 'rtl' ? ArrowLeft : ArrowLeft;

  const breakdown = computePriceBreakdown(items, DELIVERY_METHODS[0]);
  const freeShipProgress = Math.min(
    100,
    (breakdown.subtotal / breakdown.freeShippingThreshold) * 100
  );

  if (!hydrated) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <div className="animate-pulse h-8 w-8 rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 rounded-full bg-surface-elevated flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text mb-2">{t('cart.empty')}</h1>
          <p className="text-sm text-muted mb-6">{t('cart.emptyHint')}</p>
          <Link href="/" className="gold-button rounded-lg px-8 py-3 text-sm font-semibold">
            {t('common.startShopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-gold transition-colors">
          <BackIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-heading text-2xl font-bold text-text">{t('cart.title')}</h1>
        <span className="text-sm text-muted">{t('cart.itemsCount', { count: breakdown.itemCount })}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free shipping progress */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-gold" />
              {breakdown.amountUntilFreeShipping > 0 ? (
                <p className="text-sm text-text">
                  {t('cart.addMoreForFreeShipping', { amount: formatPrice(breakdown.amountUntilFreeShipping) })}
                </p>
              ) : (
                <p className="text-sm text-success font-medium">
                  {t('cart.qualifyFreeShipping')}
                </p>
              )}
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                style={{ width: `${freeShipProgress}%` }}
              />
            </div>
          </div>

          {/* Cart items */}
          <div className="bg-surface rounded-xl border border-border divide-y divide-border">
            {items.map((item) => {
              const maxQty = Math.min(item.stock, 10);
              const atMax = item.quantity >= maxQty;
              return (
                <div key={item.id} className="flex gap-4 p-4">
                  <Link href={`/product/${item.slug}`} className="shrink-0">
                    <SafeImage
                      src={item.image}
                      alt={item.title}
                      width={100}
                      height={100}
                      className="rounded-lg border border-border"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="text-sm sm:text-base font-medium text-text line-clamp-2 hover:text-gold transition-colors"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted mt-1">{t('cart.each', { price: formatPrice(item.unitPrice) })}</p>
                    {atMax && item.stock > 0 && (
                      <p className="text-xs text-amber-500 mt-1">{t('cart.maxPerOrder', { max: maxQty })}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <QuantityStepper
                          quantity={item.quantity}
                          max={maxQty}
                          onChange={(q) => {
                            if (q === item.quantity) return;
                            updateQuantity(item.id, q);
                          }}
                          size="sm"
                        />
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors"
                          aria-label={t('cart.removeAria', { title: item.title })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('cart.remove')}
                        </button>
                      </div>
                      <span className="text-base font-semibold text-text">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border p-5 lg:sticky lg:top-24">
            <h2 className="font-heading text-lg font-bold text-text mb-4">{t('common.orderSummary')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t('cart.subtotalItems', { count: breakdown.itemCount })}</span>
                <span className="text-text font-medium">{formatPrice(breakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('cart.estimatedTax')}</span>
                <span className="text-text font-medium">{formatPrice(breakdown.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">{t('common.shipping')}</span>
                <span className={cn('font-medium', breakdown.shipping === 0 ? 'text-success' : 'text-text')}>
                  {breakdown.shipping === 0 ? t('common.free') : formatPrice(breakdown.shipping)}
                </span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="text-text font-semibold">{t('common.total')}</span>
                <span className="text-xl font-bold text-gold">{formatPrice(breakdown.total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-5 w-full h-12 flex items-center justify-center gold-button rounded-lg text-sm font-semibold"
            >
              {t('cart.proceedToCheckout')}
            </Link>
            <Link
              href="/"
              className="mt-3 w-full h-10 flex items-center justify-center rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-elevated transition-colors"
            >
              {t('common.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
