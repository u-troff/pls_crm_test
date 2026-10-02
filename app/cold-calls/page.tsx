import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ColdCallsView } from "./cold-calls-view";

export default async function ColdCallsPage() {
  const [calls, clients] = await Promise.all([
    prisma.coldCall.findMany({
      include: { client: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.client.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Cold Calls" description="Log outreach and track your conversion funnel." />
      <div className="p-8">
        <ColdCallsView
          initialCalls={calls.map((c) => ({
            ...c,
            date: c.date.toISOString(),
            followUpDate: c.followUpDate ? c.followUpDate.toISOString() : null,
          }))}
          clients={clients}
        />
      </div>
    </div>
  );
}
