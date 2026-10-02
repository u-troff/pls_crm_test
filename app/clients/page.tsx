import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ClientsView } from "./clients-view";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Clients" description="Every client and prospect in one table." />
      <div className="p-8">
        <ClientsView
          initialClients={clients.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
