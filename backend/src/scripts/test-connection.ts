import "../dns-fix";
import "../env";
import { testAirtableConnection } from "../airtable";

async function main() {
  console.log("Testing Airtable connection...\n");
  const result = await testAirtableConnection();
  console.log(JSON.stringify(result, null, 2));
  if (!result.connected) {
    process.exit(1);
  }
  console.log("\nAirtable connection OK.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
