import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck } from "lucide-react";

import { WorkspaceEmptyPage } from "@/components/workspace-empty-page";

export const Route = createFileRoute("/guidance")({
  head: () => ({
    meta: [
      { title: "Remediation guidance | LogVexor" },
      { name: "description", content: "Review remediation guidance associated with connected security findings." },
      { property: "og:title", content: "Remediation guidance | LogVexor" },
      { property: "og:description", content: "Your LogVexor remediation guidance workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuidancePage,
});

function GuidancePage() {
  return (
    <WorkspaceEmptyPage
      title="Remediation guidance"
      description="A focused place for recommended next steps related to your security findings."
      section="Response"
      emptyTitle="No remediation guidance yet"
      emptyDescription="Guidance will appear when findings are available from a connected source. No recommendations have been generated."
      icon={BookOpenCheck}
    />
  );
}