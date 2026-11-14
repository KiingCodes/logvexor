import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth-screen";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account | LogVexor" },
      { name: "description", content: "Create a LogVexor account for your organization's security workspace." },
      { property: "og:title", content: "Create account | LogVexor" },
      { property: "og:description", content: "Get started with a LogVexor security workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return <AuthScreen mode="register" />;
}