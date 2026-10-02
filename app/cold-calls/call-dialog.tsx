"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import { CALL_OUTCOMES, CALL_OUTCOME_LABELS, type CallOutcome } from "@/lib/constants";
import { createColdCall, updateColdCall, deleteColdCall } from "@/app/actions/cold-calls";
import type { ColdCallDTO } from "@/lib/types";

function toLocalInputValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

type Props = {
  call?: ColdCallDTO | null;
  clients: { id: string; name: string }[];
  onSaved: (c: ColdCallDTO) => void;
  onDeleted?: (id: string) => void;
  trigger?: React.ReactElement;
};

export function CallDialog({ call, clients, onSaved, onDeleted, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [clientChoice, setClientChoice] = useState("new");
  const [prospectName, setProspectName] = useState("");
  const [date, setDate] = useState(toLocalInputValue(new Date()));
  const [outcome, setOutcome] = useState<CallOutcome>("NO_ANSWER");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!call;

  const clientItems = useMemo(() => {
    const items: Record<string, string> = { new: "New prospect (type name below)" };
    for (const c of clients) items[c.id] = c.name;
    return items;
  }, [clients]);

  useEffect(() => {
    if (!open) return;
    if (call) {
      setClientChoice(call.clientId ?? "new");
      setProspectName(call.prospectName);
      setDate(toLocalInputValue(new Date(call.date)));
      setOutcome(call.outcome as CallOutcome);
      setNotes(call.notes ?? "");
      setFollowUpDate(call.followUpDate ? format(new Date(call.followUpDate), "yyyy-MM-dd") : "");
    } else {
      setClientChoice("new");
      setProspectName("");
      setDate(toLocalInputValue(new Date()));
      setOutcome("NO_ANSWER");
      setNotes("");
      setFollowUpDate("");
    }
  }, [open, call]);

  function handleClientChoiceChange(value: string | null) {
    const resolved = value ?? "new";
    setClientChoice(resolved);
    if (resolved !== "new") {
      const client = clients.find((c) => c.id === resolved);
      if (client) setProspectName(client.name);
    } else {
      setProspectName("");
    }
  }

  function handleSave() {
    if (!prospectName.trim()) {
      toast.error("Prospect name is required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          existingClientId: clientChoice === "new" ? null : clientChoice,
          prospectName,
          date: new Date(date).toISOString(),
          outcome,
          notes,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
        };
        const saved = isEdit && call ? await updateColdCall(call.id, payload) : await createColdCall(payload);
        onSaved({
          ...saved,
          date: saved.date.toISOString(),
          followUpDate: saved.followUpDate ? saved.followUpDate.toISOString() : null,
        });
        toast.success(isEdit ? "Call updated" : "Call logged");
        setOpen(false);
      } catch {
        toast.error("Couldn't save call");
      }
    });
  }

  function handleDelete() {
    if (!call || !onDeleted) return;
    if (!confirm("Delete this call log?")) return;
    startTransition(async () => {
      try {
        await deleteColdCall(call.id);
        onDeleted(call.id);
        toast.success("Call deleted");
        setOpen(false);
      } catch {
        toast.error("Couldn't delete call");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Log Call
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit call" : "Log a cold call"}</DialogTitle>
          <DialogDescription>
            Link to an existing client or log a brand-new prospect.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Client / Prospect</Label>
            <Select items={clientItems} value={clientChoice} onValueChange={handleClientChoiceChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New prospect (type name below)</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {clientChoice === "new" && (
            <div className="space-y-1.5">
              <Label>Prospect name</Label>
              <Input value={prospectName} onChange={(e) => setProspectName(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select
                items={CALL_OUTCOME_LABELS}
                value={outcome}
                onValueChange={(v) => setOutcome(v as CallOutcome)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {CALL_OUTCOME_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Next follow-up date (optional)</Label>
            <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between">
          {isEdit && onDeleted ? (
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
