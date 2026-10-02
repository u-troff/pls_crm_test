import { prisma } from "@/lib/prisma";

export async function getBusinessConfig() {
  const existing = await prisma.businessConfig.findFirst();
  if (existing) return existing;
  return prisma.businessConfig.create({ data: {} });
}
