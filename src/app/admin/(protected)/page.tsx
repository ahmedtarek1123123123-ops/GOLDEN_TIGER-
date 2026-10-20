'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { DollarSign, ShoppingCart, MousePointerClick, TrendingUp, Package, TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import { useI18n } from '@/context/I18nContext';

interface OverviewData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    conversionRate: number;
    ctr: number;
    totalClicks: number;
    totalImpressions: number;
    avgOrderValue: number;
    todayOrders: number;
    inventoryValue: number;
    activeProducts: number;
  };
  lowStockProducts: { id: string; title: string; stock: number }[];
  recentOrders: { id: string; order_number: string | null; status: string; total_cents: number; created_at: string }[];
}

export default function AdminOverviewPage() {
  const { t } = useI18n();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/analytics/overview');
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        setData(json);
      } catch {
        setError(t('admin.overview.loadFailed'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-danger">{error ?? t('admin.overview.noData')}</p>
      </div>
    );
  }

  const { kpis, lowStockProducts, recentOrders } = data;

  const revenueByDay = recentOrders.reduce((acc: Record<string, { date: string; revenue: number; orders: number }>, order) => {
    const date = new Date(order.created_at).toISOString().slice(0, 10);
    if (!acc[date]) acc[date] = { date, revenue: 0, orders: 0 };
    acc[date].revenue += order.total_cents;
    acc[date].orders += 1;
    return acc;
  }, {});

  const chartData = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));

  const statusLabel = (status: string) => {
    const key = `admin.orderStatus.${status.toLowerCase().replace(/_/g, '')}`;
    const label = t(key);
    return label === key ? status : label;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t('admin.overview.title')}</h1>
        <p className="text-muted mt-1">{t('admin.overview.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t('admin.overview.totalRevenue')}
          value={formatPrice(kpis.totalRevenue)}
          icon={DollarSign}
          color="text-gold"
        />
        <KPICard
          label={t('admin.overview.totalOrders')}
          value={kpis.totalOrders.toString()}
          subtext={t('admin.overview.completedCount', { count: kpis.completedOrders })}
          icon={ShoppingCart}
          color="text-tiger-orange"
        />
        <KPICard
          label={t('admin.overview.ctr')}
          value={`${kpis.ctr}%`}
          subtext={t('admin.overview.ctrSubtext', { clicks: kpis.totalClicks, impressions: kpis.totalImpressions })}
          icon={MousePointerClick}
          color="text-green-400"
        />
        <KPICard
          label={t('admin.overview.conversionRate')}
          value={`${kpis.conversionRate}%`}
          subtext={t('admin.overview.ordersToday', { count: kpis.todayOrders })}
          icon={TrendingUp}
          color="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label={t('admin.overview.avgOrderValue')}
          value={formatPrice(kpis.avgOrderValue)}
          icon={DollarSign}
          color="text-gold"
        />
        <KPICard
          label={t('admin.overview.inventoryValue')}
          value={formatPrice(kpis.inventoryValue)}
          icon={Package}
          color="text-tiger-orange"
        />
        <KPICard
          label={t('admin.overview.activeProducts')}
          value={kpis.activeProducts.toString()}
          icon={Package}
          color="text-green-400"
        />
        <KPICard
          label={t('admin.overview.todaysOrders')}
          value={kpis.todayOrders.toString()}
          icon={ShoppingCart}
          color="text-blue-400"
        />
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <Card className="bg-surface border-border p-6">
          <h2 className="font-heading text-xl font-bold mb-4">{t('admin.overview.revenueChart')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
              <XAxis dataKey="date" stroke="#A8A29E" fontSize={12} />
              <YAxis stroke="#A8A29E" fontSize={12} tickFormatter={(v) => `$${(v / 100).toFixed(0)}`} />
              <Tooltip
                contentStyle={{ background: '#1D1D26', border: '1px solid #2A2A35', borderRadius: '8px' }}
                labelStyle={{ color: '#F5F1E6' }}
                formatter={(value: number) => [formatPrice(value), t('admin.overview.revenue')]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <Card className="bg-surface border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-tiger-orange" />
            <h2 className="font-heading text-xl font-bold">{t('admin.overview.lowStockAlerts')}</h2>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-muted text-sm">{t('admin.overview.allStocked')}</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-text truncate">{p.title}</span>
                  <span className={`text-sm font-semibold ${p.stock === 0 ? 'text-danger' : 'text-tiger-orange'}`}>
                    {p.stock === 0 ? t('admin.overview.outOfStock') : t('admin.overview.stockLeft', { count: p.stock })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent orders */}
        <Card className="bg-surface border-border p-6">
          <h2 className="font-heading text-xl font-bold mb-4">{t('admin.overview.recentOrders')}</h2>
          {recentOrders.length === 0 ? (
            <p className="text-muted text-sm">{t('admin.overview.noRecentOrders')}</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.slice(0, 8).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm text-text">{order.order_number ?? order.id.slice(0, 8)}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'CHECKOUT_STARTED' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gold">{formatPrice(order.total_cents)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="bg-surface border-border p-5 card-glow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs text-muted mt-1">{subtext}</p>}
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </Card>
  );
}
