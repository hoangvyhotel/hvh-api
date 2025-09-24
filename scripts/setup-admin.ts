#!/usr/bin/env ts-node

import { createAdminUser } from "../src/utils/create-admin";

async function main() {
  console.log("🔄 Creating admin user...");
  await createAdminUser();
  console.log("✅ Done!");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
