"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { bulkCreateClients } from "@/app/actions/clients";
import { STAGES, type Stage } from "@/lib/constants";

type ParsedRow = {
  name: string;
  company: string;
  phone: string;
  email: string;
  status: string;
  dealValue: string;
  notes: string;
  _duplicate: boolean;
};

export function ImportCsvDialog({
  existingPhones,
  onImported,
}: {
  existingPhones: string[];
  onImported: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const phoneSet = new Set(existingPhones.filter(Boolean));

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((r) => {
          const phone = (r.phone ?? "").trim();
          return {
            name: (r.name ?? "").trim(),
            company: (r.company ?? "").trim(),
            phone,
            email: (r.email ?? "").trim(),
            status: (r.status ?? "NEW_LEAD").trim().toUpperCase().replace(/\s+/g, "_"),
            dealValue: (r.dealValue ?? "0").trim(),
            notes: (r.notes ?? "").trim(),
            _duplicate: !!phone && phoneSet.has(phone),
          };
        });
        setRows(parsed.filter((r) => r.name));
      },
      error: () => {
        toast.error("Couldn't parse that CSV file");
      },
    });
  }

  function handleConfirm() {
    const toImport = rows.filter((r) => !r._duplicate);
    if (toImport.length === 0) {
      toast.error("No new rows to import");
      return;
    }
    startTransition(async () => {
      try {
        const { created, skipped } = await bulkCreateClients(
          toImport.map((r) => ({
            name: r.name,
            company: r.company || undefined,
            phone: r.phone || undefined,
            email: r.email || undefined,
            status: (STAGES.includes(r.status as Stage) ? r.status : "NEW_LEAD") as Stage,
            dealValue: Number(r.dealValue) || 0,
            notes: r.notes || undefined,
          }))
        );
        toast.success(`Imported ${created} clients${skipped ? ` (${skipped} skipped)` : ""}`);
        onImported();
        setRows([]);
        setFileName("");
        setOpen(false);
      } catch {
        toast.error("Import failed");
      }
    });
  }

  const duplicateCount = rows.filter((r) => r._duplicate).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        }
      />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import clients from CSV</DialogTitle>
          <DialogDescription>
            Columns expected: name, company, phone, email, status, dealValue, notes. Rows whose
            phone number already exists are skipped automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          {fileName && <span className="ml-2 text-sm text-muted-foreground">{fileName}</span>}

          {rows.length > 0 && (
            <div className="max-h-80 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deal Value</TableHead>
                    <TableHead>Import?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={r._duplicate ? "opacity-50" : undefined}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.company}</TableCell>
                      <TableCell>{r.phone}</TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.dealValue}</TableCell>
                      <TableCell>
                        {r._duplicate ? (
                          <Badge variant="secondary">Skip (duplicate phone)</Badge>
                        ) : (
                          <Badge>Import</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {rows.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {rows.length - duplicateCount} to import, {duplicateCount} skipped as duplicates.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={isPending || rows.length === 0}>
            {isPending ? "Importing..." : `Confirm import (${rows.length - duplicateCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
