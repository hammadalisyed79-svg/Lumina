-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shopifyProductId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "shopifyHandle" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceTitle" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "shopifyVariantId" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "option1" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "option2" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "option3" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Product_shopifyProductId_key" ON "Product"("shopifyProductId");
CREATE INDEX IF NOT EXISTS "Product_shopifyHandle_idx" ON "Product"("shopifyHandle");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_shopifyVariantId_key" ON "ProductVariant"("shopifyVariantId");
