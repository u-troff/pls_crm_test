import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { FinanceView } from "./finance-view";

export default async function FinancePage() {
  const transactions = await prisma.transaction.findMany({ orderBy: { date: "desc" } });

  return (
    <div>
      <PageHeader title="Finance" description="Track income and expenses across the business." />
      <div className="p-8">
        <FinanceView
          initialTransactions={transactions.map((t) => ({
            ...t,
            date: t.date.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
