-- AlterTable
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "textureImage" TEXT;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "patternScale" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "patternOffsetX" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "patternOffsetY" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "patternRotation" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "usableAsTexture" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  CREATE TYPE "FabricRepeatMode" AS ENUM ('REPEAT', 'COVER', 'CONTAIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Fabric" ADD COLUMN IF NOT EXISTS "repeatMode" "FabricRepeatMode" NOT NULL DEFAULT 'REPEAT';

ALTER TABLE "Size" ADD COLUMN IF NOT EXISTS "topDiameterCm" DECIMAL(6,2);
ALTER TABLE "Size" ADD COLUMN IF NOT EXISTS "bottomDiameterCm" DECIMAL(6,2);

ALTER TABLE "Lining" ADD COLUMN IF NOT EXISTS "rendererHex" TEXT;
ALTER TABLE "Lining" ADD COLUMN IF NOT EXISTS "reflectivityHint" DOUBLE PRECISION;

ALTER TABLE "Fitting" ADD COLUMN IF NOT EXISTS "useTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Shape" ADD COLUMN IF NOT EXISTS "useTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "ShapeSize" (
  "shapeId" TEXT NOT NULL,
  "sizeId" TEXT NOT NULL,
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  CONSTRAINT "ShapeSize_pkey" PRIMARY KEY ("shapeId","sizeId")
);

CREATE TABLE IF NOT EXISTS "ShapeFabric" (
  "shapeId" TEXT NOT NULL,
  "fabricId" TEXT NOT NULL,
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  CONSTRAINT "ShapeFabric_pkey" PRIMARY KEY ("shapeId","fabricId")
);

CREATE TABLE IF NOT EXISTS "ShapeLining" (
  "shapeId" TEXT NOT NULL,
  "liningId" TEXT NOT NULL,
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  CONSTRAINT "ShapeLining_pkey" PRIMARY KEY ("shapeId","liningId")
);

CREATE TABLE IF NOT EXISTS "ShapeFitting" (
  "shapeId" TEXT NOT NULL,
  "fittingId" TEXT NOT NULL,
  "needsReview" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  CONSTRAINT "ShapeFitting_pkey" PRIMARY KEY ("shapeId","fittingId")
);

CREATE INDEX IF NOT EXISTS "ShapeSize_sizeId_idx" ON "ShapeSize"("sizeId");
CREATE INDEX IF NOT EXISTS "ShapeFabric_fabricId_idx" ON "ShapeFabric"("fabricId");
CREATE INDEX IF NOT EXISTS "ShapeLining_liningId_idx" ON "ShapeLining"("liningId");
CREATE INDEX IF NOT EXISTS "ShapeFitting_fittingId_idx" ON "ShapeFitting"("fittingId");

DO $$ BEGIN
  ALTER TABLE "ShapeSize" ADD CONSTRAINT "ShapeSize_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeSize" ADD CONSTRAINT "ShapeSize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeFabric" ADD CONSTRAINT "ShapeFabric_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeFabric" ADD CONSTRAINT "ShapeFabric_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeLining" ADD CONSTRAINT "ShapeLining_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeLining" ADD CONSTRAINT "ShapeLining_liningId_fkey" FOREIGN KEY ("liningId") REFERENCES "Lining"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeFitting" ADD CONSTRAINT "ShapeFitting_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ShapeFitting" ADD CONSTRAINT "ShapeFitting_fittingId_fkey" FOREIGN KEY ("fittingId") REFERENCES "Fitting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
