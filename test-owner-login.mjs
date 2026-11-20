import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const supabaseUrl = await rl.question("LogVexor-Test Project URL: ");
const supabaseKey = await rl.question("LogVexor-Test Publishable Key: ");
const email = await rl.question("Owner test email: ");
const password = await rl.question("Owner test password: ");

const supabase = createClient(supabaseUrl, supabaseKey);

// Existing test organisation
const orgId = "1fe014f5-d408-4264-bd6c-7bc597d11ea5";

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.error("Login failed:", error.message);
  process.exitCode = 1;
} else {
  console.log("Owner login successful.");
  console.log("Authenticated user ID:", data.user.id);

  const testMembers = [
    {
      email: "admin-test@logvexor.local",
      userId: "603c2a8e-2569-4588-9b16-900ae105dd7b",
      role: "admin",
    },
    {
      email: "analyst-test@logvexor.local",
      userId: "f82cb5fe-a6af-4598-b2f5-9b8c70c3453b",
      role: "analyst",
    },
    {
      email: "member-test@logvexor.local",
      userId: "a451c3fd-037a-4285-bf3d-f6196b52bc0f",
      role: "viewer",
    },
  ];

  console.log("\nAdding test users to LogVexor Security Test...\n");

  for (const member of testMembers) {
    const { error: memberError } = await supabase.rpc("add_organization_member", {
      p_org_id: orgId,
      p_user_id: member.userId,
      p_role: member.role,
    });

    if (memberError) {
      console.error(`Failed: ${member.email} — ${memberError.message}`);
    } else {
      console.log(`Added: ${member.email} as ${member.role}`);
    }
  }

  console.log("\nMembership setup finished.");
}

rl.close();
