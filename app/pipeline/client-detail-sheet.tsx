"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusLabel, statusColor } from "@/lib/constants";
import { updateClient, deleteClient } from "@/app/actions/clients";
import type { ClientDTO } from "@/lib/types";

export function ClientDetailSheet({
  client,
  onClose,
  onUpdated,
  onDeleted,
}: {
  client: ClientDTO | null;
  onClose: () => void;
  onUpdated: (c: ClientDTO) => void;
  onDeleted: (id: string) => void;
}) {
  const [form, setForm] = useState<ClientDTO | null>(client);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(client);
  }, [client]);

  if (!form) return null;

  function handleSave() {
    if (!form) return;
    startTransition(async () => {
      try {
        const updated = await updateClient(form.id, {
          name: form.name,
          company: form.company ?? undefined,
          phone: form.phone ?? undefined,
          email: form.email ?? undefined,
          dealValue: form.dealValue,
          notes: form.notes ?? undefined,
          source: form.source ?? undefined,
        });
        onUpdated({
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        });
        toast.success("Client updated");
      } catch {
        toast.error("Couldn't save changes");
      }
    });
  }

  function handleDelete() {
    if (!form) return;
    if (!confirm(`Delete ${form.name}? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteClient(form.id);
        onDeleted(form.id);
        toast.success("Client deleted");
      } catch {
        toast.error("Couldn't delete client");
      }
    });
  }

  return (
    <Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{form.name}</SheetTitle>
            <Badge className={statusColor(form.status)}>
              {statusLabel(form.status)}
            </Badge>
          </div>
          <SheetDescription>
            <Link href={`/clients/${form.id}`} className="underline hover:text-foreground">
              View full client profile →
            </Link>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={form.company ?? ""}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deal value</Label>
              <Input
                type="number"
                value={form.dealValue}
                onChange={(e) => setForm({ ...form, dealValue: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input
                value={form.source ?? ""}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              rows={6}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Add notes about this client..."
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2 border-t px-4 py-3">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
            Delete
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
