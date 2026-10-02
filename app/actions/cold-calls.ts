"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CallOutcome } from "@/lib/constants";

export type ColdCallInput = {
  existingClientId?: string | null;
  prospectName: string;
  date: string;
  outcome: CallOutcome;
  notes?: string;
  followUpDate?: string | null;
};

async function resolveClientId(input: ColdCallInput) {
  if (input.existingClientId) return input.existingClientId;
  const client = await prisma.client.create({
    data: {
      name: input.prospectName,
      status: "NEW_LEAD",
      source: "Cold Call",
    },
  });
  await prisma.pipelineStage.create({ data: { clientId: client.id, stage: "NEW_LEAD" } });
  return client.id;
}

export async function createColdCall(input: ColdCallInput) {
  const clientId = await resolveClientId(input);
  const call = await prisma.coldCall.create({
    data: {
      clientId,
      prospectName: input.prospectName,
      date: new Date(input.date),
      outcome: input.outcome,
      notes: input.notes || null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  revalidatePath("/cold-calls");
  revalidatePath("/clients");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return call;
}

export async function updateColdCall(id: string, input: ColdCallInput) {
  const call = await prisma.coldCall.update({
    where: { id },
    data: {
      clientId: input.existingClientId || undefined,
      prospectName: input.prospectName,
      date: new Date(input.date),
      outcome: input.outcome,
      notes: input.notes || null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  revalidatePath("/cold-calls");
  revalidatePath("/");
  return call;
}

export async function deleteColdCall(id: string) {
  await prisma.coldCall.delete({ where: { id } });
  revalidatePath("/cold-calls");
  revalidatePath("/");
}
