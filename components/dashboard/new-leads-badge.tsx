"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getNewLeadsCount } from "@/app/actions/leads";

export function NewLeadsBadge({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const interval = setInterval(() => {
      getNewLeadsCount()
        .then(setCount)
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm font-medium">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {count} new lead{count === 1 ? "" : "s"} in the last hour
    </Badge>
  );
}
