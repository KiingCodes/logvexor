import { createFileRoute } from "@tanstack/react-router";
import { Bug } from "lucide-react";

import { WorkspaceEmptyPage } from "@/components/workspace-empty-page";

export const Route = createFileRoute("/vulnerabilities")({
  head: () => ({
    meta: [
      { title: "Vulnerabilities | LogVexor" },
      { name: "description", content: "Review vulnerability information connected to your LogVexor workspace." },
      { property: "og:title", content: "Vulnerabilities | LogVexor" },
      { property: "og:description", content: "Your LogVexor vulnerability review workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VulnerabilitiesPage,
});

function VulnerabilitiesPage() {
  return (
    <WorkspaceEmptyPage
      title="Vulnerabilities"
      description="Review and prioritize vulnerability information when security data is available."
      section="Exposure"
      emptyTitle="No vulnerability data is connected"
      emptyDescription="No scan results are displayed because scanning and vulnerability feeds have not been connected."
      icon={Bug}
    />
  );
}