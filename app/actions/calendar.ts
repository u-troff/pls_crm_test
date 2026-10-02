"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { EventType } from "@/lib/constants";

export type CalendarEventInput = {
  title: string;
  type: EventType;
  date: string; // ISO datetime string
  clientId?: string | null;
  notes?: string;
};

export async function createCalendarEvent(data: CalendarEventInput) {
  const event = await prisma.calendarEvent.create({
    data: {
      title: data.title,
      type: data.type,
      date: new Date(data.date),
      clientId: data.clientId || null,
      notes: data.notes || null,
    },
    include: { client: true },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  return event;
}

export async function updateCalendarEvent(id: string, data: CalendarEventInput) {
  const event = await prisma.calendarEvent.update({
    where: { id },
    data: {
      title: data.title,
      type: data.type,
      date: new Date(data.date),
      clientId: data.clientId || null,
      notes: data.notes || null,
    },
    include: { client: true },
  });
  revalidatePath("/calendar");
  revalidatePath("/");
  return event;
}

export async function deleteCalendarEvent(id: string) {
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/");
}
