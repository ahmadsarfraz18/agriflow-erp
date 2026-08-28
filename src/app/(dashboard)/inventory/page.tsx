import { findProducts, findBatches } from '@/db/queries';
import { InventoryClient } from '@/components/inventory-client';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const [products, batches] = await Promise.all([findProducts(), findBatches()]);

  return (
    <InventoryClient
      products={products.map(p => ({
        id: p.id,
        name: p.name,
        brandName: p.brandName,
        category: p.category,
        packSize: p.packSize,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        minThreshold: p.minThreshold,
      }))}
      batches={batches.map(b => ({
        id: b.id,
        productId: b.productId,
        quantityCurrent: b.quantityCurrent,
      }))}
    />
  );
}
