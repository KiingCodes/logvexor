import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { WorkspaceEmptyPage } from "@/components/workspace-empty-page";

export const Route = createFileRoute("/risks")({
  head: () => ({
    meta: [
      { title: "Risk overview | LogVexor" },
      { name: "description", content: "Explore security risks from data connected to LogVexor." },
      { property: "og:title", content: "Risk overview | LogVexor" },
      { property: "og:description", content: "Your LogVexor security risk workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RisksPage,
});

function RisksPage() {
  return (
    <WorkspaceEmptyPage
      title="Risk overview"
      description="Understand exposure and prioritize security risks across connected environments."
      section="Prioritization"
      emptyTitle="Risk assessment is not connected"
      emptyDescription="Risk assessments require vulnerability and asset data. No risk scores or findings are being generated."
      icon={ShieldAlert}
    />
  );
}