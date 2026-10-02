"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Stage } from "@/lib/constants";

export type ClientInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  status?: Stage;
  dealValue?: number;
  notes?: string;
  source?: string;
};

export async function createClient(data: ClientInput) {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      status: data.status ?? "NEW_LEAD",
      dealValue: data.dealValue ?? 0,
      notes: data.notes || null,
      source: data.source || null,
    },
  });
  await prisma.pipelineStage.create({
    data: { clientId: client.id, stage: client.status },
  });
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath("/");
  return client;
}

export async function updateClient(id: string, data: ClientInput) {
  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      company: data.company || null,
      phone: data.phone || null,
      email: data.email || null,
      dealValue: data.dealValue,
      notes: data.notes || null,
      source: data.source || null,
    },
  });
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/");
  return client;
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath("/");
}

export async function updateClientStage(id: string, stage: Stage) {
  const client = await prisma.client.update({
    where: { id },
    data: { status: stage },
  });
  await prisma.pipelineStage.create({
    data: { clientId: id, stage },
  });
  revalidatePath("/pipeline");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/");
  return client;
}

export async function updateClientNotes(id: string, notes: string) {
  await prisma.client.update({ where: { id }, data: { notes } });
  revalidatePath("/pipeline");
  revalidatePath(`/clients/${id}`);
}

export async function bulkCreateClients(
  rows: { name: string; company?: string; phone?: string; email?: string; status?: Stage; dealValue?: number; notes?: string }[]
) {
  const existingPhones = new Set(
    (await prisma.client.findMany({ where: { phone: { not: null } }, select: { phone: true } }))
      .map((c) => c.phone)
      .filter(Boolean)
  );

  const toCreate = rows.filter((r) => !r.phone || !existingPhones.has(r.phone));
  const skipped = rows.length - toCreate.length;

  for (const row of toCreate) {
    const client = await prisma.client.create({
      data: {
        name: row.name,
        company: row.company || null,
        phone: row.phone || null,
        email: row.email || null,
        status: row.status ?? "NEW_LEAD",
        dealValue: row.dealValue ?? 0,
        notes: row.notes || null,
      },
    });
    await prisma.pipelineStage.create({ data: { clientId: client.id, stage: client.status } });
  }

  revalidatePath("/clients");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { created: toCreate.length, skipped };
}
