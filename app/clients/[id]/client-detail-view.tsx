"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import {
  statusLabel,
  statusColor,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  outcomeLabel,
  outcomeColor,
  type EventType,
} from "@/lib/constants";
import { deleteClient, updateClientNotes } from "@/app/actions/clients";
import type { ClientDTO } from "@/lib/types";

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

type PipelineStageDTO = { id: string; stage: string; updatedAt: string };
type CalendarEventDTO = { id: string; title: string; type: string; date: string; notes: string | null };
type ColdCallDTO = {
  id: string;
  prospectName: string;
  date: string;
  outcome: string;
  notes: string | null;
  followUpDate: string | null;
};

type FullClient = ClientDTO & {
  pipelineStages: PipelineStageDTO[];
  calendarEvents: CalendarEventDTO[];
  coldCalls: ColdCallDTO[];
};

export function ClientDetailView({ client }: { client: FullClient }) {
  const router = useRouter();
  const [notes, setNotes] = useState(client.notes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete ${client.name}? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteClient(client.id);
        toast.success("Client deleted");
        router.push("/clients");
      } catch {
        toast.error("Couldn't delete client");
      }
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      try {
        await updateClientNotes(client.id, notes);
        toast.success("Notes saved");
      } catch {
        toast.error("Couldn't save notes");
      }
    });
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description={client.company ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <ClientFormDialog
              client={client}
              onSaved={() => router.refresh()}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              }
            />
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="space-y-4 p-8">
        <Link href="/clients" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to clients
        </Link>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Contact Info
                  <Badge className={statusColor(client.status)}>
                    {statusLabel(client.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Company" value={client.company} />
                <Row label="Phone" value={client.phone} />
                <Row label="Email" value={client.email} />
                <Row label="Source" value={client.source} />
                <Row label="Deal value" value={currency(client.dealValue)} />
                <Row label="Date added" value={format(new Date(client.createdAt), "MMM d, yyyy")} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this client..."
                />
                <Button size="sm" onClick={handleSaveNotes} disabled={isPending}>
                  Save notes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.pipelineStages.length === 0 && (
                  <p className="text-sm text-muted-foreground">No stage history yet.</p>
                )}
                {client.pipelineStages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between text-sm">
                    <Badge variant="secondary" className={statusColor(stage.stage)}>
                      {statusLabel(stage.stage)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(stage.updatedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cold Calls ({client.coldCalls.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.coldCalls.length === 0 && (
                  <p className="text-sm text-muted-foreground">No cold calls logged yet.</p>
                )}
                {client.coldCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{format(new Date(call.date), "MMM d, yyyy h:mm a")}</p>
                      {call.notes && <p className="text-xs text-muted-foreground">{call.notes}</p>}
                    </div>
                    <Badge className={outcomeColor(call.outcome)}>
                      {outcomeLabel(call.outcome)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Calendar Events ({client.calendarEvents.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.calendarEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No events linked yet.</p>
                )}
                {client.calendarEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[event.type as EventType] }}
                      />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {EVENT_TYPE_LABELS[event.type as EventType]}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(event.date), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
