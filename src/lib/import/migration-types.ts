export type MigrationStatus =
  | "DISCOVERED"
  | "PARSED"
  | "IMAGES_DOWNLOADED"
  | "IMPORTED"
  | "NEEDS_REVIEW"
  | "FAILED";

export type SourceCollection = {
  handle: string;
  title: string;
  productsCount: number | null;
  pagesCrawled: number;
  productHandles: string[];
  productUrls: string[];
};

export type SourceOption = {
  name: string;
  values: string[];
};

export type SourceVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  compareAtPrice: string | null;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  imageId: string | null;
};

export type SourceImage = {
  id: string;
  src: string;
  highResSrc: string;
  position: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  localPath?: string;
  contentHash?: string;
  downloadStatus?: "downloaded" | "exists" | "failed" | "skipped_dup";
  downloadError?: string;
};

export type SourceProduct = {
  sourceWebsite: string;
  sourceProductUrl: string;
  sourceHandle: string;
  shopifyId: string;
  originalTitle: string;
  displayName: string;
  bodyHtml: string;
  sourceDescription: string;
  description: string;
  shortDescription: string;
  vendor: string;
  productType: string;
  tags: string[];
  collectionHandles: string[];
  category: "LAMPSHADE" | "FABRIC" | "CUSHION" | "KIT" | "ACCESSORY";
  shapeKey: string | null;
  material: string | null;
  colourTags: string[];
  patternTags: string[];
  moodTags: string[];
  currency: "GBP";
  basePrice: string;
  compareAtPrice: string | null;
  sourceAvailability: "available" | "sold_out" | "mixed";
  options: SourceOption[];
  variants: SourceVariant[];
  images: SourceImage[];
  personalisationSupported: boolean;
  leadTimeDays: number | null;
  migrationStatus: MigrationStatus;
  needsReview: boolean;
  reviewReasons: string[];
  parsedAt?: string;
};

export type DiscoveryReport = {
  crawledAt: string;
  sourceWebsite: string;
  collectionsDiscovered: number;
  collectionPagesCrawled: number;
  productLinksFound: number;
  uniqueProducts: number;
  duplicateUrlsRemoved: number;
  collections: SourceCollection[];
  uniqueHandles: string[];
};

export type ImageAuditReport = {
  completedAt: string;
  productsWithZeroImages: string[];
  productsWithOneImage: string[];
  productsWithMultipleImages: number;
  imagesDiscovered: number;
  imagesDownloaded: number;
  imagesSkippedExisting: number;
  imagesDeduped: number;
  failedDownloads: { handle: string; url: string; error: string }[];
};

export type ImportReport = {
  completedAt: string;
  discovery: DiscoveryReport;
  productsParsed: number;
  productsFailed: number;
  images: ImageAuditReport;
  productsImported: number;
  productsNeedingReview: number;
  failedPages: { url: string; error: string }[];
  byCategory: Record<string, number>;
  byCollection: Record<string, number>;
  database: {
    upsertedProducts: number;
    upsertedVariants: number;
    upsertedImages: number;
    upsertedCollections: number;
  };
};
