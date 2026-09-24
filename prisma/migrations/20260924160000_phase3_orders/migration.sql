-- Phase 3: sequential order numbers + server cart persistence
CREATE TABLE IF NOT EXISTS "OrderSequence" (
    "id" INTEGER NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OrderSequence" ("id", "nextValue")
VALUES (1, 1)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemsJson" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Cart_userId_key" ON "Cart"("userId");

DO $$ BEGIN
  ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
