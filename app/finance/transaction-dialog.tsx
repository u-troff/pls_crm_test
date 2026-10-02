"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { TRANSACTION_TYPES, type TransactionType } from "@/lib/constants";
import { createTransaction, updateTransaction, deleteTransaction } from "@/app/actions/finance";
import type { TransactionDTO } from "@/lib/types";

const TYPE_LABELS: Record<TransactionType, string> = { INCOME: "Income", EXPENSE: "Expense" };

type Props = {
  transaction?: TransactionDTO | null;
  onSaved: (t: TransactionDTO) => void;
  onDeleted?: (id: string) => void;
  trigger?: React.ReactElement;
};

export function TransactionDialog({ transaction, onSaved, onDeleted, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("INCOME");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setDate(format(new Date(transaction.date), "yyyy-MM-dd"));
      setDescription(transaction.description);
      setCategory(transaction.category);
      setAmount(String(transaction.amount));
      setType(transaction.type as TransactionType);
    } else {
      setDate(format(new Date(), "yyyy-MM-dd"));
      setDescription("");
      setCategory("");
      setAmount("");
      setType("INCOME");
    }
  }, [open, transaction]);

  function handleSave() {
    if (!description.trim() || !category.trim() || !amount) {
      toast.error("Description, category, and amount are required");
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          date,
          description,
          category,
          amount: Number(amount),
          type,
        };
        const saved = transaction
          ? await updateTransaction(transaction.id, payload)
          : await createTransaction(payload);
        onSaved({ ...saved, date: saved.date.toISOString() });
        toast.success(transaction ? "Transaction updated" : "Transaction added");
        setOpen(false);
      } catch {
        toast.error("Couldn't save transaction");
      }
    });
  }

  function handleDelete() {
    if (!transaction || !onDeleted) return;
    if (!confirm("Delete this transaction?")) return;
    startTransition(async () => {
      try {
        await deleteTransaction(transaction.id);
        onDeleted(transaction.id);
        toast.success("Transaction deleted");
        setOpen(false);
      } catch {
        toast.error("Couldn't delete transaction");
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
              Add Transaction
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>Log income or an expense for the business.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select items={TYPE_LABELS} value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Software" />
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-row justify-between">
          {transaction && onDeleted ? (
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
