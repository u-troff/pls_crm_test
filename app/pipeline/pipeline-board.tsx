"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS, STAGE_COLORS, type Stage } from "@/lib/constants";
import { updateClientStage } from "@/app/actions/clients";
import type { ClientDTO } from "@/lib/types";
import { ClientDetailSheet } from "./client-detail-sheet";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function DealCard({ client, onOpen }: { client: ClientDTO; onOpen: (c: ClientDTO) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: client.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(client)}
      className={cn(
        "cursor-grab touch-none rounded-lg border bg-card p-3 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <p className="font-medium">{client.name}</p>
      {client.company && <p className="text-xs text-muted-foreground">{client.company}</p>}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">{currency(client.dealValue)}</span>
        <span className="text-muted-foreground">
          {format(new Date(client.updatedAt), "MMM d")}
        </span>
      </div>
    </div>
  );
}

function Column({
  stage,
  clients,
  onOpenClient,
}: {
  stage: Stage;
  clients: ClientDTO[];
  onOpenClient: (c: ClientDTO) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = clients.reduce((sum, c) => sum + c.dealValue, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "border-brand bg-brand/5"
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STAGE_COLORS[stage])} />
          <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
          <Badge variant="secondary" className="text-xs">
            {clients.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {clients.map((client) => (
          <DealCard key={client.id} client={client} onOpen={onOpenClient} />
        ))}
        {clients.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">No deals here</p>
        )}
      </div>
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        {currency(total)} total
      </div>
    </div>
  );
}

export function PipelineBoard({ initialClients }: { initialClients: ClientDTO[] }) {
  const [clients, setClients] = useState<ClientDTO[]>(initialClients);
  const [activeClient, setActiveClient] = useState<ClientDTO | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientDTO | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped = useMemo(() => {
    const map: Record<Stage, ClientDTO[]> = {
      NEW_LEAD: [],
      CONTACTED: [],
      QUALIFIED: [],
      PROPOSAL_SENT: [],
      WON: [],
      LOST: [],
    };
    for (const client of clients) {
      map[client.status as Stage]?.push(client);
    }
    return map;
  }, [clients]);

  function handleDragStart(event: DragStartEvent) {
    const client = clients.find((c) => c.id === event.active.id);
    setActiveClient(client ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveClient(null);
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as Stage;
    const client = clients.find((c) => c.id === active.id);
    if (!client || client.status === newStage) return;

    const prevClients = clients;
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? { ...c, status: newStage } : c))
    );

    startTransition(async () => {
      try {
        await updateClientStage(client.id, newStage);
      } catch {
        setClients(prevClients);
        toast.error("Couldn't update stage, please try again.");
      }
    });
  }

  function handleClientCreated(client: ClientDTO) {
    setClients((prev) => [client, ...prev]);
  }

  function handleClientUpdated(updated: ClientDTO) {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
  }

  function handleClientDeleted(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setSelectedClient(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex justify-end px-8 pt-4">
        <ClientFormDialog onSaved={handleClientCreated} />
      </div>
      <DndContext
        id="pipeline-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto px-8 py-4">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              clients={grouped[stage]}
              onOpenClient={setSelectedClient}
            />
          ))}
        </div>
        <DragOverlay>
          {activeClient && (
            <Card className="w-64 cursor-grabbing border bg-card p-3 text-sm shadow-lg">
              <p className="font-medium">{activeClient.name}</p>
              {activeClient.company && (
                <p className="text-xs text-muted-foreground">{activeClient.company}</p>
              )}
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <ClientDetailSheet
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onUpdated={handleClientUpdated}
        onDeleted={handleClientDeleted}
      />
    </div>
  );
}
