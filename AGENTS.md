<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. The remaining Lovable-managed
pieces below must be changed in Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database migrations.**
  1. Migrations may be created and maintained in VS Code.
  2. GitHub Copilot may prepare SQL migration files inside `supabase/migrations/`.
  3. Every migration must be reviewed before execution.
  4. Approved migrations may be executed manually through the Supabase SQL Editor.
  5. Every migration must be committed to GitHub for version control.
  6. Never execute migrations automatically against production.
  7. Never expose Supabase service-role keys or privileged credentials.
  8. Maintain strict organisation-level data isolation and RLS policies.
  9. Lovable remains responsible for frontend development and UI changes.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## App structure
- Keep LogVexor screens as top-level TanStack routes with a shared workspace shell; until the user's Supabase project is connected, auth and organization actions must not claim persistence, and security screens must not imply scans or fabricated results.
