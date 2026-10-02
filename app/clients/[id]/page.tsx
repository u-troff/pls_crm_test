import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientDetailView } from "./client-detail-view";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      pipelineStages: { orderBy: { updatedAt: "desc" } },
      calendarEvents: { orderBy: { date: "asc" } },
      coldCalls: { orderBy: { date: "desc" } },
    },
  });

  if (!client) notFound();

  return (
    <ClientDetailView
      client={{
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        pipelineStages: client.pipelineStages.map((p) => ({
          ...p,
          updatedAt: p.updatedAt.toISOString(),
        })),
        calendarEvents: client.calendarEvents.map((e) => ({
          ...e,
          date: e.date.toISOString(),
        })),
        coldCalls: client.coldCalls.map((c) => ({
          ...c,
          date: c.date.toISOString(),
          followUpDate: c.followUpDate ? c.followUpDate.toISOString() : null,
        })),
      }}
    />
  );
}
