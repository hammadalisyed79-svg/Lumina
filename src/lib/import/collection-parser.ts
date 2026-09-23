import type { SourceCollection } from "./migration-types";
import { BASE, fetchJson, sleep } from "./http";

type CollectionsJson = {
  collections: {
    handle: string;
    title: string;
    products_count?: number;
  }[];
};

type CollectionProductsJson = {
  products: {
    id: number | string;
    handle: string;
  }[];
};

export async function discoverCollections(): Promise<
  Omit<SourceCollection, "pagesCrawled" | "productHandles" | "productUrls">[]
> {
  const data = await fetchJson<CollectionsJson>(`${BASE}/collections.json?limit=250`);
  return (data.collections || []).map((c) => ({
    handle: c.handle,
    title: c.title,
    productsCount: c.products_count ?? null,
  }));
}

/** Paginate every collection page until empty. */
export async function crawlCollectionProducts(
  handle: string
): Promise<Pick<SourceCollection, "pagesCrawled" | "productHandles" | "productUrls">> {
  const handles: string[] = [];
  const urls: string[] = [];
  let pagesCrawled = 0;

  for (let page = 1; page <= 100; page++) {
    const url = `${BASE}/collections/${encodeURIComponent(handle)}/products.json?limit=50&page=${page}`;
    const data = await fetchJson<CollectionProductsJson>(url);
    pagesCrawled++;
    const batch = data.products || [];
    if (!batch.length) break;
    for (const p of batch) {
      handles.push(p.handle);
      urls.push(`${BASE}/products/${p.handle}`);
    }
    console.log(`  [${handle}] page ${page}: +${batch.length} (running ${handles.length})`);
    if (batch.length < 50) break;
    await sleep(250);
  }

  return { pagesCrawled, productHandles: handles, productUrls: urls };
}
