import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "./pipeline-board";

export default async function PipelinePage() {
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pipeline"
        description="Drag cards between stages as deals progress."
      />
      <div className="flex-1 overflow-hidden">
        <PipelineBoard
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
