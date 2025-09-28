import dotenv from "dotenv";
import { testGrowwToken } from "./getNewGrowwAccessToken.js";

// Load environment variables
dotenv.config();

console.log(
  "🧪 Testing Groww API Token Generation (TypeScript Implementation)...\n"
);

// Run the test
testGrowwToken()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
