import { Product } from "../models/product";

// Create a concise, deterministic label for a sale based on its products
export function createSaleLabel(products: ReadonlyArray<Product> | undefined, fallbackDate?: Date): string {
  if (!products || products.length === 0) {
    return fallbackDate ? formatDateYMD(fallbackDate) : 'Sale';
  }

  const first = products[0];
  const count = products.length;
  const desc = first.listing?.description?.trim();
  const brand = (first.listing?.brand || '')?.toString().trim();
  const category = (first.listing?.category || '')?.toString().trim();

  // If all brands are the same and non-empty, prefer brand aggregation for multi-item sales
  if (count > 1) {
    const brands = new Set(
      products
        .map(p => (p.listing?.brand || '')?.toString().trim())
        .filter(Boolean)
    );
    if (brands.size === 1) {
      const b = Array.from(brands)[0];
      if (b) return `${truncate(b, 40)} +${count - 1} more`;
    }
  }

  // Single item or mixed brands: use description when available
  if (desc) {
    return count > 1 ? `${truncate(desc, 40)} +${count - 1} more` : truncate(desc, 50);
  }

  // Build from brand/category fallbacks
  const primary = brand || category;
  if (primary) {
    return count > 1 ? `${truncate(primary, 40)} +${count - 1} more` : truncate(primary, 50);
  }

  // Ultimate fallback
  return fallbackDate ? formatDateYMD(fallbackDate) : 'Sale';
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function formatDateYMD(d: Date): string {
  try {
    const date = new Date(d);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return 'Sale';
  }
}
