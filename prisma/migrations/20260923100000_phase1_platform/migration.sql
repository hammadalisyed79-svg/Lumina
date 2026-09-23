-- Phase 1: RBAC, fulfilment, inventory, CMS foundations

-- Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- OrderStatus workshop values
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PRODUCTION';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'QC';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';

-- Bespoke / Trade enums
ALTER TYPE "BespokeStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "BespokeStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'NEW';
ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'REVIEWING';

-- New enums
DO $$ BEGIN
  CREATE TYPE "ProductionStatus" AS ENUM ('NONE', 'QUEUED', 'IN_PRODUCTION', 'QC', 'PACKED', 'DISPATCHED', 'COMPLETE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InventoryKind" AS ENUM ('FINISHED', 'KIT', 'FABRIC', 'COMPONENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HomepageSectionType" AS ENUM (
    'HERO', 'SHOP_BY_SHAPE', 'FEATURED_COLLECTION', 'DESIGN_YOUR_SHADE',
    'SHOP_BY_MOOD', 'EDITORIAL', 'BEST_SELLERS', 'CUSTOMER_HOMES',
    'REVIEWS', 'TRADE', 'NEWSLETTER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order fulfilment columns
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "productionStatus" "ProductionStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dispatchedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "staffNotes" TEXT;

CREATE INDEX IF NOT EXISTS "Order_productionStatus_idx" ON "Order"("productionStatus");

-- Fabric extras
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "internalCode" TEXT;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "pattern" TEXT;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "stockQty" INTEGER;

-- Size extras
ALTER TABLE "Size" ADD COLUMN IF NOT EXISTS "shapeId" TEXT;
ALTER TABLE "Size" ADD COLUMN IF NOT EXISTS "displayUnit" TEXT NOT NULL DEFAULT 'cm';

-- Lining / Fitting / Shape extras
ALTER TABLE "Lining" ADD COLUMN IF NOT EXISTS "swatchUrl" TEXT;
ALTER TABLE "Lining" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Fitting" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Fitting" ADD COLUMN IF NOT EXISTS "compatibility" TEXT;
ALTER TABLE "Shape" ADD COLUMN IF NOT EXISTS "priceMod" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- TradeApplication extras
ALTER TABLE "TradeApplication" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "TradeApplication" ADD COLUMN IF NOT EXISTS "estimatedVolume" TEXT;
ALTER TABLE "TradeApplication" ADD COLUMN IF NOT EXISTS "discountPercent" DECIMAL(5,2);
ALTER TABLE "TradeApplication" ADD COLUMN IF NOT EXISTS "tradePricingEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Newsletter
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'subscribed';
ALTER TABLE "NewsletterSubscriber" ADD COLUMN IF NOT EXISTS "unsubscribedAt" TIMESTAMP(3);

-- MediaAsset
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "filename" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "caption" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'image';

-- Size → Shape FK
DO $$ BEGIN
  ALTER TABLE "Size" ADD CONSTRAINT "Size_shapeId_fkey"
    FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "Size_shapeId_idx" ON "Size"("shapeId");

-- Product eligibility joins
CREATE TABLE IF NOT EXISTS "ProductShape" (
  "productId" TEXT NOT NULL,
  "shapeId" TEXT NOT NULL,
  CONSTRAINT "ProductShape_pkey" PRIMARY KEY ("productId","shapeId")
);
CREATE TABLE IF NOT EXISTS "ProductFabric" (
  "productId" TEXT NOT NULL,
  "fabricId" TEXT NOT NULL,
  CONSTRAINT "ProductFabric_pkey" PRIMARY KEY ("productId","fabricId")
);
CREATE TABLE IF NOT EXISTS "ProductSize" (
  "productId" TEXT NOT NULL,
  "sizeId" TEXT NOT NULL,
  CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("productId","sizeId")
);
CREATE TABLE IF NOT EXISTS "ProductLining" (
  "productId" TEXT NOT NULL,
  "liningId" TEXT NOT NULL,
  CONSTRAINT "ProductLining_pkey" PRIMARY KEY ("productId","liningId")
);
CREATE TABLE IF NOT EXISTS "ProductFitting" (
  "productId" TEXT NOT NULL,
  "fittingId" TEXT NOT NULL,
  CONSTRAINT "ProductFitting_pkey" PRIMARY KEY ("productId","fittingId")
);

DO $$ BEGIN
  ALTER TABLE "ProductShape" ADD CONSTRAINT "ProductShape_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductShape" ADD CONSTRAINT "ProductShape_shapeId_fkey"
    FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductFabric" ADD CONSTRAINT "ProductFabric_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductFabric" ADD CONSTRAINT "ProductFabric_fabricId_fkey"
    FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductSize" ADD CONSTRAINT "ProductSize_sizeId_fkey"
    FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductLining" ADD CONSTRAINT "ProductLining_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductLining" ADD CONSTRAINT "ProductLining_liningId_fkey"
    FOREIGN KEY ("liningId") REFERENCES "Lining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductFitting" ADD CONSTRAINT "ProductFitting_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductFitting" ADD CONSTRAINT "ProductFitting_fittingId_fkey"
    FOREIGN KEY ("fittingId") REFERENCES "Fitting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Permission / RBAC
CREATE TABLE IF NOT EXISTS "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_key_key" ON "Permission"("key");
CREATE INDEX IF NOT EXISTS "Permission_module_idx" ON "Permission"("module");

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "role" "Role" NOT NULL,
  "permissionId" TEXT NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role","permissionId")
);
CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
DO $$ BEGIN
  ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey"
    FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Inventory
CREATE TABLE IF NOT EXISTS "InventoryItem" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "InventoryKind" NOT NULL DEFAULT 'OTHER',
  "productId" TEXT,
  "fabricId" TEXT,
  "available" INTEGER NOT NULL DEFAULT 0,
  "reserved" INTEGER NOT NULL DEFAULT 0,
  "incoming" INTEGER NOT NULL DEFAULT 0,
  "reorderLevel" INTEGER NOT NULL DEFAULT 0,
  "trackStock" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX IF NOT EXISTS "InventoryItem_kind_idx" ON "InventoryItem"("kind");
CREATE INDEX IF NOT EXISTS "InventoryItem_productId_idx" ON "InventoryItem"("productId");
CREATE INDEX IF NOT EXISTS "InventoryItem_fabricId_idx" ON "InventoryItem"("fabricId");

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
  "id" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "delta" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "note" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InventoryMovement_itemId_createdAt_idx" ON "InventoryMovement"("itemId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_fabricId_fkey"
    FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Contact + notes
CREATE TABLE IF NOT EXISTS "ContactEnquiry" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContactEnquiry_status_idx" ON "ContactEnquiry"("status");
CREATE INDEX IF NOT EXISTS "ContactEnquiry_email_idx" ON "ContactEnquiry"("email");
CREATE INDEX IF NOT EXISTS "ContactEnquiry_createdAt_idx" ON "ContactEnquiry"("createdAt");
DO $$ BEGIN
  ALTER TABLE "ContactEnquiry" ADD CONSTRAINT "ContactEnquiry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CustomerNote" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "authorId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CustomerNote_customerId_idx" ON "CustomerNote"("customerId");
DO $$ BEGIN
  ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Navigation
CREATE TABLE IF NOT EXISTS "NavigationMenu" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NavigationMenu_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NavigationMenu_key_key" ON "NavigationMenu"("key");

CREATE TABLE IF NOT EXISTS "NavigationItem" (
  "id" TEXT NOT NULL,
  "menuId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "parentId" TEXT,
  CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "NavigationItem_menuId_sortOrder_idx" ON "NavigationItem"("menuId", "sortOrder");
DO $$ BEGIN
  ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_menuId_fkey"
    FOREIGN KEY ("menuId") REFERENCES "NavigationMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Homepage sections
CREATE TABLE IF NOT EXISTS "HomepageSection" (
  "id" TEXT NOT NULL,
  "type" "HomepageSectionType" NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "body" TEXT,
  "imageUrl" TEXT,
  "ctaLabel" TEXT,
  "ctaHref" TEXT,
  "payload" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "HomepageSection_enabled_sortOrder_idx" ON "HomepageSection"("enabled", "sortOrder");
CREATE INDEX IF NOT EXISTS "HomepageSection_type_idx" ON "HomepageSection"("type");

-- AuditLog indexes
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "MediaAsset_folder_idx" ON "MediaAsset"("folder");
CREATE INDEX IF NOT EXISTS "MediaAsset_type_idx" ON "MediaAsset"("type");
CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
