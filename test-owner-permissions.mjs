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
    const email = (await rl.question("Owner email: ")).trim();
    const password = await rl.question("Owner password: ");

    supabase = createClient(url, key);

    const orgId = "1fe014f5-d408-4264-bd6c-7bc597d11ea5";
    const ownerId = "d89251fb-dc73-4fee-aab0-7f22689e3062";

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(`Login failed: ${error.message}`);

    authenticated = true;

    if (data.user.id !== ownerId) {
      throw new Error("The signed-in account is not the expected Owner.");
    }

    console.log("\nOwner login successful.");
    console.log("Running Owner permission tests...\n");

    let passed = 0;
    let failed = 0;

    async function test(name, action, expected) {
      const result = await action();
      const error = result?.error ?? null;
      let success = false;
      let message = error ? error.message : "Request allowed";

      if (expected === "ALLOWED") success = !error;

      if (expected === "DENIED") {
        success = !!error;
        if (!error) message = "Unexpectedly allowed";
      }

      if (success) passed++;
      else failed++;

      console.log(`${success ? "PASS" : "CHECK"} | ${name} | ${message}`);
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
      () => supabase.from("organization_memberships").select("user_id, role").eq("org_id", orgId),
      "ALLOWED",
    );

    await test(
      "Create asset",
      () =>
        supabase.from("assets").insert({
          org_id: orgId,
          created_by: data.user.id,
          asset_type: "domain",
          canonical_value: "owner-test-2.invalid",
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

    console.log("\n-------------------------------");
    console.log(`Owner tests completed: ${passed}/6 passed`);
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
