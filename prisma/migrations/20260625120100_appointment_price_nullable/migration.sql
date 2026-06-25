-- Make Appointment.price optional. NULL means "Sorulur" until barber sets it.
ALTER TABLE "Appointment" ALTER COLUMN "price" DROP NOT NULL;
