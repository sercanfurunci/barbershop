import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

// DELETE /api/customer/favorites/:shopId — remove a favorite
export const DELETE = withAuth(async (request, { params }, payload) => {

  const { shopId } = await params;

  await prisma.customerFavorite.deleteMany({
    where: { userId: payload.userId, shopId },
  });

  return NextResponse.json({ ok: true });
});
