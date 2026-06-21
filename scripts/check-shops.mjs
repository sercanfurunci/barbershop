import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const shop = await prisma.shop.findUnique({
  where: { slug: "abdurrahman" },
  select: { name: true, address: true, phone: true },
});
console.log(JSON.stringify(shop, null, 2));
await prisma.$disconnect();
