'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Package, Plus, Search, Pencil, Trash2, Loader as Loader2, CircleAlert as AlertCircle, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';

interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  sku: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  is_published: boolean;
  category_id: string;
  rating: number;
  review_count: number;
  tags: string[];
  description?: string;
  short_description?: string | null;
  features?: string[];
  images?: string[];
  video_urls?: string[];
  specifications?: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  is_sponsored?: boolean;
  is_homepage_banner?: boolean;
  ad_priority?: number;
  banner_image_url?: string | null;
  banner_headline?: string | null;
  banner_subtext?: string | null;
  ad_starts_at?: string | null;
  ad_ends_at?: string | null;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch('/api/admin/categories');
      if (res.ok) setCategories(await res.json());
    }
    loadCategories();
  }, []);

  function handleEdit(product: Product) {
    setEditProduct(product);
    setIsDialogOpen(true);
  }

  function handleCreate() {
    setEditProduct({
      id: '',
      slug: '',
      title: '',
      brand: null,
      sku: null,
      price_cents: 0,
      compare_at_cents: null,
      stock: 0,
      is_published: true,
      category_id: categories[0]?.id ?? '',
      rating: 0,
      review_count: 0,
      tags: [],
      description: '',
      features: [],
      images: [],
      video_urls: [],
      specifications: null,
      is_sponsored: false,
      is_homepage_banner: false,
      ad_priority: 0,
      banner_image_url: null,
      banner_headline: null,
      banner_subtext: null,
      ad_starts_at: null,
      ad_ends_at: null,
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    if (!editProduct) return;
    setSaving(true);
    try {
      const body = {
        ...editProduct,
        features: editProduct.features ?? [],
        images: editProduct.images ?? [],
        video_urls: editProduct.video_urls ?? [],
        tags: editProduct.tags ?? [],
        price_cents: Number(editProduct.price_cents),
        compare_at_cents: editProduct.compare_at_cents ? Number(editProduct.compare_at_cents) : null,
        stock: Number(editProduct.stock),
      };

      const isEdit = !!editProduct.id && products.some(p => p.id === editProduct.id);
      const url = isEdit ? `/api/admin/products/${editProduct.id}` : '/api/admin/products';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsDialogOpen(false);
        setEditProduct(null);
        loadProducts();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      loadProducts();
    } catch {
      // ignore
    }
  }

  function updateField<K extends keyof Product>(field: K, value: Product[K]) {
    if (editProduct) setEditProduct({ ...editProduct, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted mt-1">{total} products in catalog</p>
        </div>
        <Button onClick={handleCreate} className="gold-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-surface"
        />
      </div>

      {/* Products table */}
      <Card className="bg-surface border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Package className="w-12 h-12 mb-3" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">SKU</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Stock</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-text">{p.title}</div>
                      <div className="text-xs text-muted">{p.brand ?? 'No brand'}</div>
                    </td>
                    <td className="py-3 px-4 text-muted">{p.sku ?? '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-semibold text-gold">{formatPrice(p.price_cents)}</div>
                      {p.compare_at_cents && (
                        <div className="text-xs text-muted line-through">{formatPrice(p.compare_at_cents)}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${
                        p.stock === 0 ? 'text-danger' : p.stock < 10 ? 'text-tiger-orange' : 'text-text'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={p.is_published ? 'default' : 'secondary'} className={p.is_published ? 'bg-green-500/20 text-green-400' : ''}>
                        {p.is_published ? 'Live' : 'Hidden'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-muted hover:text-gold transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-surface border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct?.id ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>

          {editProduct && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editProduct.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={editProduct.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={editProduct.brand ?? ''}
                    onChange={(e) => updateField('brand', e.target.value || null)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={editProduct.sku ?? ''}
                    onChange={(e) => updateField('sku', e.target.value || null)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editProduct.category_id}
                  onValueChange={(v) => updateField('category_id', v)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price (cents)</Label>
                  <Input
                    type="number"
                    value={editProduct.price_cents}
                    onChange={(e) => updateField('price_cents', Number(e.target.value))}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Compare At (cents)</Label>
                  <Input
                    type="number"
                    value={editProduct.compare_at_cents ?? ''}
                    onChange={(e) => updateField('compare_at_cents', e.target.value ? Number(e.target.value) : null)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={editProduct.stock}
                    onChange={(e) => updateField('stock', Number(e.target.value))}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={editProduct.short_description ?? ''}
                  onChange={(e) => updateField('short_description', e.target.value || null)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editProduct.description ?? ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={(editProduct.tags ?? []).join(', ')}
                  onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={(editProduct.features ?? []).join('\n')}
                  onChange={(e) => updateField('features', e.target.value.split('\n').map(f => f.trim()).filter(Boolean))}
                  rows={4}
                  placeholder={'Enter one feature per line'}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Image URLs (one per line)</Label>
                <Textarea
                  value={(editProduct.images ?? []).join('\n')}
                  onChange={(e) => updateField('images', e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                  rows={4}
                  placeholder={'https://images.pexels.com/...\nhttps://images.pexels.com/...'}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Video URLs (one per line)</Label>
                <Textarea
                  value={(editProduct.video_urls ?? []).join('\n')}
                  onChange={(e) => updateField('video_urls', e.target.value.split('\n').map(u => u.trim()).filter(Boolean))}
                  rows={2}
                  placeholder={'https://www.youtube.com/watch?v=...'}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  value={editProduct.seo_title ?? ''}
                  onChange={(e) => updateField('seo_title', e.target.value || null)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea
                  value={editProduct.seo_description ?? ''}
                  onChange={(e) => updateField('seo_description', e.target.value || null)}
                  rows={2}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>SEO Meta Keywords</Label>
                <Textarea
                  value={editProduct.seo_keywords ?? ''}
                  onChange={(e) => updateField('seo_keywords', e.target.value || null)}
                  rows={2}
                  placeholder={'keyword1, keyword2, keyword3'}
                  className="bg-background"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch
                  checked={editProduct.is_published}
                  onCheckedChange={(v) => updateField('is_published', v)}
                />
              </div>

              {/* Advertising Panel */}
              <div className="border border-border rounded-lg p-4 space-y-4 bg-background/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-semibold text-gold">Advertising Settings</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sponsored Search Placement</Label>
                    <p className="text-xs text-muted mt-0.5">Pin this product at the top of search and category results</p>
                  </div>
                  <Switch
                    checked={editProduct.is_sponsored ?? false}
                    onCheckedChange={(v) => updateField('is_sponsored', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Homepage Hero Banner</Label>
                    <p className="text-xs text-muted mt-0.5">Feature this product as a rotating banner on the homepage</p>
                  </div>
                  <Switch
                    checked={editProduct.is_homepage_banner ?? false}
                    onCheckedChange={(v) => updateField('is_homepage_banner', v)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ad Priority (0-100)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={editProduct.ad_priority ?? 0}
                      onChange={(e) => updateField('ad_priority', Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted">Higher values appear first</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Ad Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={editProduct.ad_starts_at ? editProduct.ad_starts_at.slice(0, 16) : ''}
                      onChange={(e) => updateField('ad_starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ad End Date</Label>
                  <Input
                    type="datetime-local"
                    value={editProduct.ad_ends_at ? editProduct.ad_ends_at.slice(0, 16) : ''}
                    onChange={(e) => updateField('ad_ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="bg-background"
                  />
                </div>

                {(editProduct.is_homepage_banner) && (
                  <>
                    <div className="space-y-2">
                      <Label>Banner Image URL (optional)</Label>
                      <Input
                        value={editProduct.banner_image_url ?? ''}
                        onChange={(e) => updateField('banner_image_url', e.target.value || null)}
                        className="bg-background"
                        placeholder="Leave blank to use product image"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Banner Headline (optional)</Label>
                      <Input
                        value={editProduct.banner_headline ?? ''}
                        onChange={(e) => updateField('banner_headline', e.target.value || null)}
                        className="bg-background"
                        placeholder="Leave blank to use product title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Banner Subtext (optional)</Label>
                      <Input
                        value={editProduct.banner_subtext ?? ''}
                        onChange={(e) => updateField('banner_subtext', e.target.value || null)}
                        className="bg-background"
                        placeholder="Leave blank to use short description"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gold-button">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="bg-surface border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-danger" />
              Delete Product
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted py-4">Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
