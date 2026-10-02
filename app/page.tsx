import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBusinessConfig } from "@/lib/business-config";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  statusLabel,
  statusColor,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  type EventType,
} from "@/lib/constants";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { NewLeadsBadge } from "@/components/dashboard/new-leads-badge";
import { getNewLeadsCount } from "@/app/actions/leads";

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function DashboardPage() {
  const config = await getBusinessConfig();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [openDeals, callsAll, transactionsThisMonth, upcomingEvents, newLeadsCount] = await Promise.all([
    prisma.client.findMany({ where: { status: { notIn: ["WON", "LOST"] } } }),
    prisma.coldCall.findMany(),
    prisma.transaction.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.calendarEvent.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 5,
      include: { client: true },
    }),
    getNewLeadsCount(),
  ]);

  const callsToday = callsAll.filter((c) => isSameDay(c.date, now)).length;
  const netIncome = transactionsThisMonth.reduce(
    (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount),
    0
  );
  const openDealsValue = openDeals.reduce((sum, c) => sum + c.dealValue, 0);

  const stats = [
    {
      label: "Open Deals",
      value: openDeals.length.toString(),
      sub: `${currency(openDealsValue)} in pipeline`,
      href: "/pipeline",
    },
    {
      label: "Calls Today",
      value: callsToday.toString(),
      sub: `${callsAll.length} logged total`,
      href: "/cold-calls",
    },
    {
      label: "Net Income (This Month)",
      value: currency(netIncome),
      sub: netIncome >= 0 ? "Positive cash flow" : "Spending more than earning",
      href: "/finance",
    },
    {
      label: "Upcoming Events",
      value: upcomingEvents.length.toString(),
      sub: "Next 5 shown below",
      href: "/calendar",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back to ${config.businessName}`}
        description="Here's what's happening across your business right now."
        action={<NewLeadsBadge initialCount={newLeadsCount} />}
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-colors hover:border-brand/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Open Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {openDeals.length === 0 && (
                <p className="text-sm text-muted-foreground">No open deals yet.</p>
              )}
              {openDeals.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                      {client.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{client.company}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{currency(client.dealValue)}</span>
                    <Badge className={statusColor(client.status)}>
                      {statusLabel(client.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
              )}
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[event.type as EventType] }}
                    />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {EVENT_TYPE_LABELS[event.type as EventType]}
                        {event.client ? ` · ${event.client.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(event.date, "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
