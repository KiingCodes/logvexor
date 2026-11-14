import { createFileRoute } from "@tanstack/react-router";
import { Box } from "lucide-react";

import { WorkspaceEmptyPage } from "@/components/workspace-empty-page";

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Asset inventory | LogVexor" },
      { name: "description", content: "Review your organization's connected asset inventory in LogVexor." },
      { property: "og:title", content: "Asset inventory | LogVexor" },
      { property: "og:description", content: "Your LogVexor asset inventory workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <WorkspaceEmptyPage
      title="Asset inventory"
      description="A place to review the systems and services connected to your organization."
      section="Discovery"
      emptyTitle="No asset data is connected"
      emptyDescription="An asset inventory will appear here once a data source is connected. LogVexor has not discovered or scanned any assets."
      icon={Box}
    />
  );
}