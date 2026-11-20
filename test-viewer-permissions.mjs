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
    const url = (await rl.question("LogVexor-Test Project URL: ")).trim().replace(/^`|`$/g, "");

    const key = (await rl.question("Publishable key: ")).trim();
    const email = (await rl.question("Viewer email: ")).trim();
    const password = await rl.question("Viewer password: ");

    // Validate required inputs.
    if (!url || !key || !email || !password) {
      throw new Error("All inputs are required.");
    }

    // Validate and normalize Supabase URL.
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error(`Invalid Supabase URL: ${JSON.stringify(url)}`);
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
      throw new Error(`Invalid Supabase URL: ${JSON.stringify(url)}`);
    }

    console.log("\nConnecting to Supabase...");
    console.log("Project URL:", parsedUrl.origin);

    supabase = createClient(parsedUrl.origin, key);

    const orgId = "1fe014f5-d408-4264-bd6c-7bc597d11ea5";

    // Authenticate viewer.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    authenticated = true;

    console.log("\nViewer login successful.");
    console.log("Viewer ID:", data.user.id);
    console.log("\nRunning viewer permission tests...\n");

    let failures = 0;
    let passedTests = 0;

    async function test(name, action, expected) {
      try {
        const result = await action();
        const error = result?.error ?? null;

        let passed = false;
        let message = "No error";

        if (expected === "ALLOWED") {
          passed = !error;
          message = error ? error.message : "Request allowed";
        } else if (expected === "DENIED") {
          passed = !!error;
          message = error ? error.message : "Unexpectedly allowed";
        } else if (expected === "ZERO_ROWS") {
          passed = !error && result.data?.length === 0;

          message = error ? error.message : `Affected rows: ${result.data?.length ?? "unknown"}`;
        }

        if (passed) {
          passedTests++;
        } else {
          failures++;
        }

        console.log(`${passed ? "PASS" : "CHECK"} | ${name} | ${message}`);

        return passed;
      } catch (err) {
        failures++;

        console.log(`CHECK | ${name} | ${err.message}`);

        return false;
      }
    }

    // 1. Viewer should be able to read organisation.
    await test(
      "Read organisation",
      () => supabase.from("organizations").select("id").eq("id", orgId),
      "ALLOWED",
    );

    // 2. Viewer must not be able to modify organisation.
    // Returning zero rows means RLS prevented the update
    // from affecting the target organisation.
    await test(
      "Update organisation",
      () =>
        supabase.from("organizations").update({ name: "Viewer Test" }).eq("id", orgId).select("id"),
      "ZERO_ROWS",
    );

    // 3. Viewer should be able to read memberships.
    await test(
      "Read memberships",
      () => supabase.from("organization_memberships").select("user_id").eq("org_id", orgId),
      "ALLOWED",
    );

    // 4. Viewer must not be able to create assets.
    await test(
      "Create asset",
      () =>
        supabase.from("assets").insert({
          org_id: orgId,
          created_by: data.user.id,
          asset_type: "domain",
          canonical_value: "viewer-test.invalid",
        }),
      "DENIED",
    );

    // 5. Viewer must not be able to create scans.
    await test(
      "Create scan",
      () =>
        supabase.from("scans").insert({
          org_id: orgId,
          requested_by: data.user.id,
          status: "queued",
        }),
      "DENIED",
    );

    // 6. Viewer should be able to read findings.
    await test(
      "Read findings",
      () => supabase.from("findings").select("id").eq("org_id", orgId),
      "ALLOWED",
    );

    console.log("\n--------------------------------");
    console.log("Viewer tests completed.");
    console.log(`Passed checks: ${passedTests}/6`);
    console.log(`Failed checks: ${failures}`);
    console.log("--------------------------------");

    if (failures > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("\nTest execution failed:", err.message);
    process.exitCode = 1;
  } finally {
    // Always sign out after successful authentication.
    if (authenticated && supabase) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("\nSign-out warning:", error.message);
      }
    }

    rl.close();
  }
}

await main();
