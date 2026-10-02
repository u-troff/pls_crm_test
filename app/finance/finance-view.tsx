"use client";

import { useMemo, useState } from "react";
import { format, isWithinInterval, parseISO, startOfMonth, subMonths } from "date-fns";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinanceChart } from "./finance-chart";
import { TransactionDialog } from "./transaction-dialog";
import type { TransactionDTO } from "@/lib/types";

function currency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const TYPE_FILTER_ITEMS = { all: "All types", INCOME: "Income", EXPENSE: "Expense" };

export function FinanceView({ initialTransactions }: { initialTransactions: TransactionDTO[] }) {
  const [transactions, setTransactions] = useState<TransactionDTO[]>(initialTransactions);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function handleSaved(t: TransactionDTO) {
    setTransactions((prev) => {
      const exists = prev.some((x) => x.id === t.id);
      return exists ? prev.map((x) => (x.id === t.id ? t : x)) : [t, ...prev];
    });
  }

  function handleDeleted(id: string) {
    setTransactions((prev) => prev.filter((x) => x.id !== id));
  }

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))).sort(),
    [transactions]
  );

  const categoryItems = useMemo(() => {
    const items: Record<string, string> = { all: "All categories" };
    for (const c of categories) items[c] = c;
    return items;
  }, [categories]);

  const now = new Date();
  const monthStart = startOfMonth(now);

  const { totalIncome, totalExpense, netThisMonth } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let net = 0;
    for (const t of transactions) {
      if (t.type === "INCOME") income += t.amount;
      else expense += t.amount;
      const d = new Date(t.date);
      if (d >= monthStart) net += t.type === "INCOME" ? t.amount : -t.amount;
    }
    return { totalIncome: income, totalExpense: expense, netThisMonth: net };
  }, [transactions, monthStart]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => subMonths(startOfMonth(now), 5 - i));
    return months.map((monthDate) => {
      const label = format(monthDate, "MMM");
      let income = 0;
      let expense = 0;
      for (const t of transactions) {
        const d = new Date(t.date);
        if (d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth()) {
          if (t.type === "INCOME") income += t.amount;
          else expense += t.amount;
        }
      }
      return { month: label, income: Math.round(income), expense: Math.round(expense) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
      .filter((t) => {
        if (!from && !to) return true;
        const d = parseISO(t.date);
        const start = from ? parseISO(from) : new Date(0);
        const end = to ? parseISO(to) : new Date(8640000000000000);
        return isWithinInterval(d, { start, end });
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, typeFilter, categoryFilter, from, to]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{currency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{currency(totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netThisMonth >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {currency(netThisMonth)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <FinanceChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Transactions</CardTitle>
          <TransactionDialog onSaved={handleSaved} />
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select items={TYPE_FILTER_ITEMS} value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_FILTER_ITEMS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select items={categoryItems} value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryItems).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <span className="text-sm text-muted-foreground">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            {(from || to || typeFilter !== "all" || categoryFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(t.date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>
                    <Badge variant={t.type === "INCOME" ? "default" : "secondary"}>
                      {t.type === "INCOME" ? "Income" : "Expense"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      t.type === "INCOME" ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {currency(t.amount)}
                  </TableCell>
                  <TableCell>
                    <TransactionDialog
                      transaction={t}
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
                    No transactions match these filters.
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
