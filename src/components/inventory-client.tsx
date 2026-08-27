'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProduct, updateProduct, deleteProduct } from '@/app/actions/inventory';
import { formatPKR } from '@/lib/format';

type Product = {
  id: string;
  name: string;
  brandName: string;
  category: string;
  packSize: string;
  costPrice: string;
  salePrice: string;
  minThreshold: number;
};

type Batch = {
  id: string;
  productId: string;
  quantityCurrent: number;
};

const CATEGORIES = ['INSECTICIDE', 'HERBICIDE', 'FUNGICIDE', 'FERTILIZER', 'PGR'] as const;

const EMPTY_FORM = {
  name: '',
  brandName: '',
  activeIngredient: '',
  category: '',
  packSize: '',
  unitOfMeasure: '',
  costPrice: '',
  salePrice: '',
  minThreshold: '',
};

export function InventoryClient({
  products: initialProducts,
  batches,
}: {
  products: Product[];
  batches: Batch[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  function getStockForProduct(productId: string) {
    return batches
      .filter(b => b.productId === productId)
      .reduce((sum, b) => sum + b.quantityCurrent, 0);
  }

  const filtered = initialProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setError('');
  }

  function resetEditForm() {
    setEditForm(EMPTY_FORM);
    setEditError('');
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      brandName: product.brandName,
      activeIngredient: '',
      category: product.category,
      packSize: product.packSize,
      unitOfMeasure: '',
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      minThreshold: String(product.minThreshold),
    });
    setEditError('');
    setIsEditDialogOpen(true);
  }

  async function handleAdd() {
    if (!form.name || !form.brandName || !form.activeIngredient || !form.category || !form.packSize || !form.unitOfMeasure || !form.costPrice || !form.salePrice) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    startTransition(async () => {
      try {
        await createProduct({
          name: form.name,
          brandName: form.brandName,
          activeIngredient: form.activeIngredient,
          category: form.category as typeof CATEGORIES[number],
          packSize: form.packSize,
          unitOfMeasure: form.unitOfMeasure,
          costPrice: form.costPrice,
          salePrice: form.salePrice,
          minThreshold: parseInt(form.minThreshold || '0', 10),
        });
        resetForm();
        setIsAddDialogOpen(false);
        router.refresh();
      } catch {
        setError('Failed to create product. Please try again.');
      }
    });
  }

  async function handleEdit() {
    if (!editingProduct) return;
    if (!editForm.name || !editForm.brandName || !editForm.activeIngredient || !editForm.category || !editForm.packSize || !editForm.unitOfMeasure || !editForm.costPrice || !editForm.salePrice) {
      setEditError('Please fill in all required fields');
      return;
    }
    setEditError('');
    startTransition(async () => {
      try {
        await updateProduct(editingProduct.id, {
          name: editForm.name,
          brandName: editForm.brandName,
          activeIngredient: editForm.activeIngredient,
          category: editForm.category as typeof CATEGORIES[number],
          packSize: editForm.packSize,
          unitOfMeasure: editForm.unitOfMeasure,
          costPrice: editForm.costPrice,
          salePrice: editForm.salePrice,
          minThreshold: parseInt(editForm.minThreshold || '0', 10),
        });
        resetEditForm();
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        router.refresh();
      } catch {
        setEditError('Failed to update product. Please try again.');
      }
    });
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(product.id);
        router.refresh();
      } catch {
        alert('Failed to delete product.');
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage products and batches</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger render={<Button />}>Add Product</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Input placeholder="Product Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Brand Name *" value={form.brandName} onChange={(e) => setForm(f => ({ ...f, brandName: e.target.value }))} />
              <Input placeholder="Active Ingredient *" value={form.activeIngredient} onChange={(e) => setForm(f => ({ ...f, activeIngredient: e.target.value }))} />
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v ?? '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Category *" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Pack Size *" value={form.packSize} onChange={(e) => setForm(f => ({ ...f, packSize: e.target.value }))} />
              <Input placeholder="Unit of Measure *" value={form.unitOfMeasure} onChange={(e) => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))} />
              <Input placeholder="Cost Price (PKR) *" type="number" value={form.costPrice} onChange={(e) => setForm(f => ({ ...f, costPrice: e.target.value }))} />
              <Input placeholder="Sale Price (PKR) *" type="number" value={form.salePrice} onChange={(e) => setForm(f => ({ ...f, salePrice: e.target.value }))} />
              <Input placeholder="Min Threshold *" type="number" value={form.minThreshold} onChange={(e) => setForm(f => ({ ...f, minThreshold: e.target.value }))} />
              <Button className="w-full" onClick={handleAdd} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { resetEditForm(); setEditingProduct(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <Input placeholder="Product Name *" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Brand Name *" value={editForm.brandName} onChange={(e) => setEditForm(f => ({ ...f, brandName: e.target.value }))} />
            <Input placeholder="Active Ingredient *" value={editForm.activeIngredient} onChange={(e) => setEditForm(f => ({ ...f, activeIngredient: e.target.value }))} />
            <Select value={editForm.category} onValueChange={(v) => setEditForm(f => ({ ...f, category: v ?? '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Category *" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Pack Size *" value={editForm.packSize} onChange={(e) => setEditForm(f => ({ ...f, packSize: e.target.value }))} />
            <Input placeholder="Unit of Measure *" value={editForm.unitOfMeasure} onChange={(e) => setEditForm(f => ({ ...f, unitOfMeasure: e.target.value }))} />
            <Input placeholder="Cost Price (PKR) *" type="number" value={editForm.costPrice} onChange={(e) => setEditForm(f => ({ ...f, costPrice: e.target.value }))} />
            <Input placeholder="Sale Price (PKR) *" type="number" value={editForm.salePrice} onChange={(e) => setEditForm(f => ({ ...f, salePrice: e.target.value }))} />
            <Input placeholder="Min Threshold *" type="number" value={editForm.minThreshold} onChange={(e) => setEditForm(f => ({ ...f, minThreshold: e.target.value }))} />
            <Button className="w-full" onClick={handleEdit} disabled={isPending}>
              {isPending ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pack Size</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const stock = getStockForProduct(p.id);
                  const isLow = stock < p.minThreshold;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.brandName}</TableCell>
                      <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                      <TableCell>{p.packSize}</TableCell>
                      <TableCell>{stock}</TableCell>
                      <TableCell>{formatPKR(p.salePrice)}</TableCell>
                      <TableCell>
                        <Badge variant={isLow ? 'destructive' : 'default'}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(p)} disabled={isPending}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} disabled={isPending}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
