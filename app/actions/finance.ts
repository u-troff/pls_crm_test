"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TransactionType } from "@/lib/constants";

export type TransactionInput = {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
};

export async function createTransaction(data: TransactionInput) {
  const tx = await prisma.transaction.create({
    data: {
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      amount: data.amount,
      type: data.type,
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
  return tx;
}

export async function updateTransaction(id: string, data: TransactionInput) {
  const tx = await prisma.transaction.update({
    where: { id },
    data: {
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      amount: data.amount,
      type: data.type,
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
  return tx;
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/finance");
  revalidatePath("/");
}
