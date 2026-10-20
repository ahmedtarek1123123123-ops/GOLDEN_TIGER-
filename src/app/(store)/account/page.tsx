'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, LogOut, Loader as Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/layout/Logo';
import { SafeImage } from '@/components/ui/SafeImage';
import { formatPrice } from '@/lib/pricing';

interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  totalFormatted: string;
  status: string;
  completedAt: string | null;
  itemCount: number;
  items: { title: string; image: string | null; quantity: number; unitPriceCents: number }[];
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t, locale } = useI18n();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirect=/account');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/account/orders', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text mb-2">{t('account.title')}</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </div>

      {/* Profile */}
      <div className="bg-surface rounded-xl border border-border p-5 sm:p-6 mb-6">
        <h2 className="font-heading text-lg font-bold text-text mb-4">{t('account.profile')}</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{t('common.email')}</span>
            <span className="text-text">{user.email}</span>
          </div>
          {user.name && (
            <div className="flex justify-between">
              <span className="text-muted">{t('account.name')}</span>
              <span className="text-text">{user.name}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="mt-4 flex items-center gap-2 text-sm text-danger hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('account.signOut')}
        </button>
      </div>

      {/* Order History */}
      <div className="bg-surface rounded-xl border border-border p-5 sm:p-6">
        <h2 className="font-heading text-lg font-bold text-text mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-gold" />
          {t('account.orderHistory')}
        </h2>

        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-gold animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-4">{t('account.noOrders')}</p>
            <Link href="/" className="gold-button rounded-lg px-6 py-2.5 text-sm">
              {t('common.startShopping')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{order.orderNumber}</p>
                    <p className="text-xs text-muted">
                      {order.completedAt
                        ? new Date(order.completedAt).toLocaleDateString(dateLocale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gold">{order.totalFormatted}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {order.items.slice(0, 4).map((item, i) => (
                    <div key={i} className="shrink-0 flex items-center gap-2">
                      {item.image && (
                        <SafeImage
                          src={item.image}
                          alt={item.title}
                          width={40}
                          height={40}
                          className="rounded-lg border border-border"
                        />
                      )}
                      <div className="text-xs">
                        <p className="text-text line-clamp-1 max-w-[120px]">{item.title}</p>
                        <p className="text-muted">{t('common.qty', { qty: item.quantity })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
