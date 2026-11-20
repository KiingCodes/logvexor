import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  let supabase;
  let authenticated = false;

  try {
    const url = (await rl.question("LogVexor-Test Project URL: ")).trim();
    const key = (await rl.question("Publishable key: ")).trim();
    const email = (await rl.question("Admin email: ")).trim();
    const password = await rl.question("Admin password: ");

    supabase = createClient(url, key);

    const orgId = "1fe014f5-d408-4264-bd6c-7bc597d11ea5";
    const ownerId = "d89251fb-dc73-4fee-aab0-7f22689e3062";
    const newUserId = "560cfe1d-a1d6-40f0-83a9-7c93ffc2b400";

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(`Login failed: ${error.message}`);

    authenticated = true;
    console.log("\nAdmin login successful.");
    console.log("Running Admin permission tests...\n");

    let passed = 0;
    let failed = 0;

    async function test(name, action, expected) {
      try {
        const result = await action();
        const error = result?.error ?? null;

        let success = false;
        let message = error ? error.message : "Request allowed";

        if (expected === "ALLOWED") success = !error;

        if (expected === "DENIED") {
          success = !!error;
          if (!error) message = "Unexpectedly allowed";
        }

        if (expected === "ZERO_ROWS") {
          success = !error && result.data?.length === 0;
          message = error ? error.message : `Affected rows: ${result.data?.length ?? "unknown"}`;
        }

        if (success) passed++;
        else failed++;

        console.log(`${success ? "PASS" : "CHECK"} | ${name} | ${message}`);
      } catch (err) {
        failed++;
        console.log(`CHECK | ${name} | ${err.message}`);
      }
    }

    await test(
      "Read organisation",
      () => supabase.from("organizations").select("id").eq("id", orgId),
      "ALLOWED",
    );

    await test(
      "Update organisation",
      () =>
        supabase
          .from("organizations")
          .update({ name: "LogVexor Security Test" })
          .eq("id", orgId)
          .select("id"),
      "ALLOWED",
    );

    await test(
      "Read memberships",
      () => supabase.from("organization_memberships").select("user_id").eq("org_id", orgId),
      "ALLOWED",
    );

    await test(
      "Create asset",
      () =>
        supabase.from("assets").insert({
          org_id: orgId,
          created_by: data.user.id,
          asset_type: "domain",
          canonical_value: "admin-test-2.invalid",
        }),
      "ALLOWED",
    );

    await test(
      "Create scan",
      () =>
        supabase.from("scans").insert({
          org_id: orgId,
          requested_by: data.user.id,
        }),
      "ALLOWED",
    );

    await test(
      "Read findings",
      () => supabase.from("findings").select("id").eq("org_id", orgId),
      "ALLOWED",
    );

    await test(
      "Add new viewer membership",
      () =>
        supabase.rpc("add_organization_member", {
          p_org_id: orgId,
          p_user_id: newUserId,
          p_role: "viewer",
        }),
      "ALLOWED",
    );

    await test(
      "Change owner role",
      () =>
        supabase.rpc("change_organization_member_role", {
          p_org_id: orgId,
          p_user_id: ownerId,
          p_new_role: "admin",
        }),
      "DENIED",
    );

    console.log("\n-------------------------------");
    console.log(`Admin tests completed: ${passed}/8 passed`);
    console.log(`Checks requiring investigation: ${failed}`);
    console.log("-------------------------------");
  } catch (err) {
    console.error("\nTest execution failed:", err.message);
    process.exitCode = 1;
  } finally {
    if (authenticated && supabase) {
      await supabase.auth.signOut();
    }
    rl.close();
  }
}

await main();
