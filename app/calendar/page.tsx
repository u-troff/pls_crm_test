import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const [events, clients] = await Promise.all([
    prisma.calendarEvent.findMany({
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Calendar" description="Follow-ups, calls, and meetings in one place." />
      <div className="flex-1 overflow-hidden">
        <CalendarView
          initialEvents={events.map((e) => ({
            ...e,
            date: e.date.toISOString(),
          }))}
          clients={clients}
        />
      </div>
    </div>
  );
}
