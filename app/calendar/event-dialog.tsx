"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES, EVENT_TYPE_LABELS, type EventType } from "@/lib/constants";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "@/app/actions/calendar";
import type { CalendarEventDTO } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date | null;
  event: CalendarEventDTO | null;
  clients: { id: string; name: string }[];
  onSaved: (event: CalendarEventDTO) => void;
  onDeleted: (id: string) => void;
};

function toLocalInputValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function EventDialog({
  open,
  onOpenChange,
  defaultDate,
  event,
  clients,
  onSaved,
  onDeleted,
}: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("MEETING");
  const [dateValue, setDateValue] = useState("");
  const [clientId, setClientId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const clientItems = useMemo(() => {
    const items: Record<string, string> = { none: "No client" };
    for (const c of clients) items[c.id] = c.name;
    return items;
  }, [clients]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type as EventType);
      setDateValue(toLocalInputValue(new Date(event.date)));
      setClientId(event.clientId ?? "none");
      setNotes(event.notes ?? "");
    } else {
      setTitle("");
      setType("MEETING");
      setDateValue(toLocalInputValue(defaultDate ?? new Date()));
      setClientId("none");
      setNotes("");
    }
  }, [event, defaultDate, open]);

  function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          title,
          type,
          date: new Date(dateValue).toISOString(),
          clientId: clientId === "none" ? null : clientId,
          notes,
        };
        const saved = event
          ? await updateCalendarEvent(event.id, payload)
          : await createCalendarEvent(payload);
        onSaved({ ...saved, date: saved.date.toISOString() });
        toast.success(event ? "Event updated" : "Event created");
        onOpenChange(false);
      } catch {
        toast.error("Couldn't save event");
      }
    });
  }

  function handleDelete() {
    if (!event) return;
    if (!confirm(`Delete "${event.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCalendarEvent(event.id);
        onDeleted(event.id);
        toast.success("Event deleted");
        onOpenChange(false);
      } catch {
        toast.error("Couldn't delete event");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            {event ? "Update the details or delete this event." : "Schedule a follow-up, call, or meeting."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call with..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                items={EVENT_TYPE_LABELS}
                value={type}
                onValueChange={(v) => setType(v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EVENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date & time</Label>
              <Input
                type="datetime-local"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Linked client (optional)</Label>
            <Select items={clientItems} value={clientId} onValueChange={(v) => setClientId(v ?? "none")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between">
          {event ? (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
