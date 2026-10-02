"use server";

import { subHours } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getNewLeadsCount() {
  return prisma.client.count({
    where: { createdAt: { gte: subHours(new Date(), 1) } },
  });
}
