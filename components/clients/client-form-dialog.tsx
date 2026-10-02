"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/constants";
import { createClient, updateClient } from "@/app/actions/clients";
import type { ClientDTO } from "@/lib/types";

const emptyForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  status: "NEW_LEAD" as Stage,
  dealValue: "",
  source: "",
  notes: "",
};

type Props = {
  client?: ClientDTO | null;
  onSaved: (c: ClientDTO) => void;
  trigger?: React.ReactElement;
};

export function ClientFormDialog({ client, onSaved, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!client;

  useEffect(() => {
    if (!open) return;
    if (client) {
      setForm({
        name: client.name,
        company: client.company ?? "",
        phone: client.phone ?? "",
        email: client.email ?? "",
        status: client.status as Stage,
        dealValue: String(client.dealValue),
        source: client.source ?? "",
        notes: client.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, client]);

  function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          name: form.name,
          company: form.company || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          status: form.status,
          dealValue: form.dealValue ? Number(form.dealValue) : 0,
          source: form.source || undefined,
          notes: form.notes || undefined,
        };
        const saved =
          isEdit && client ? await updateClient(client.id, payload) : await createClient(payload);
        onSaved({
          ...saved,
          createdAt: saved.createdAt.toISOString(),
          updatedAt: saved.updatedAt.toISOString(),
        });
        toast.success(isEdit ? "Client updated" : "Client added");
        setOpen(false);
      } catch {
        toast.error("Couldn't save client");
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
              New Client
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "Add a new client"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this client's details." : "Create a client record."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Deal value</Label>
            <Input
              type="number"
              value={form.dealValue}
              onChange={(e) => setForm({ ...form, dealValue: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Stage</Label>
            <Select
              items={STAGE_LABELS}
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as Stage })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save changes" : "Create client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
