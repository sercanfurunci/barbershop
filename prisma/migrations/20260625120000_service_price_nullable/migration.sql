-- Make Service.price optional. NULL means "Sorulur" (ask for price).
ALTER TABLE "Service" ALTER COLUMN "price" DROP NOT NULL;
