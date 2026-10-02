"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay, isWithinInterval, subDays } from "date-fns";
import { ArrowUpDown, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CALL_OUTCOME_LABELS, outcomeLabel, outcomeColor } from "@/lib/constants";
import { CallDialog } from "./call-dialog";
import type { ColdCallDTO } from "@/lib/types";

const OUTCOME_FILTER_ITEMS = {
  all: "All outcomes",
  "Not Yet Called": "Not Yet Called",
  ...CALL_OUTCOME_LABELS,
};

function computeStats(calls: ColdCallDTO[]) {
  const made = calls.length;
  const connects = calls.filter((c) => c.outcome !== "NO_ANSWER").length;
  const meetings = calls.filter((c) => c.outcome === "BOOKED_MEETING" || c.outcome === "CLOSED").length;
  const conversionRate = made === 0 ? 0 : Math.round((meetings / made) * 100);
  return { made, connects, meetings, conversionRate };
}

export function ColdCallsView({
  initialCalls,
  clients,
}: {
  initialCalls: ColdCallDTO[];
  clients: { id: string; name: string }[];
}) {
  const [calls, setCalls] = useState<ColdCallDTO[]>(initialCalls);
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  function handleSaved(c: ColdCallDTO) {
    setCalls((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      return exists ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev];
    });
  }

  function handleDeleted(id: string) {
    setCalls((prev) => prev.filter((c) => c.id !== id));
  }

  const now = useMemo(() => new Date(), []);
  const todayCalls = useMemo(
    () => calls.filter((c) => isSameDay(new Date(c.date), now)),
    [calls, now]
  );
  const weekCalls = useMemo(
    () => calls.filter((c) => new Date(c.date) >= subDays(now, 7)),
    [calls, now]
  );

  const todayStats = computeStats(todayCalls);
  const weekStats = computeStats(weekCalls);

  const filtered = useMemo(() => {
    return calls
      .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter)
      .filter((c) => {
        if (!from && !to) return true;
        const d = new Date(c.date);
        const start = from ? new Date(from) : new Date(0);
        const end = to ? new Date(to) : new Date(8640000000000000);
        return isWithinInterval(d, { start, end });
      })
      .sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortDesc ? -diff : diff;
      });
  }, [calls, outcomeFilter, from, to, sortDesc]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-3 text-center">
            <Stat label="Calls" value={todayStats.made} />
            <Stat label="Connects" value={todayStats.connects} />
            <Stat label="Meetings" value={todayStats.meetings} />
            <Stat label="Conv. Rate" value={`${todayStats.conversionRate}%`} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-3 text-center">
            <Stat label="Calls" value={weekStats.made} />
            <Stat label="Connects" value={weekStats.connects} />
            <Stat label="Meetings" value={weekStats.meetings} />
            <Stat label="Conv. Rate" value={`${weekStats.conversionRate}%`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Call History</CardTitle>
          <CallDialog clients={clients} onSaved={handleSaved} />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select items={OUTCOME_FILTER_ITEMS} value={outcomeFilter} onValueChange={(v) => setOutcomeFilter(v ?? "all")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OUTCOME_FILTER_ITEMS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
            {(from || to || outcomeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setOutcomeFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => setSortDesc((s) => !s)}
                  >
                    Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Prospect</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(call.date), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell>
                    {call.clientId ? (
                      <Link href={`/clients/${call.clientId}`} className="font-medium hover:underline">
                        {call.prospectName}
                      </Link>
                    ) : (
                      call.prospectName
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={outcomeColor(call.outcome)}>
                      {outcomeLabel(call.outcome)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {call.followUpDate ? format(new Date(call.followUpDate), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {call.notes}
                  </TableCell>
                  <TableCell>
                    <CallDialog
                      call={call}
                      clients={clients}
                      onSaved={handleSaved}
                      onDeleted={handleDeleted}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No calls match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
