import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth-screen";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in | LogVexor" },
      { name: "description", content: "Sign in to your LogVexor security workspace." },
      { property: "og:title", content: "Sign in | LogVexor" },
      { property: "og:description", content: "Access your LogVexor security workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  return <AuthScreen mode="sign-in" />;
}