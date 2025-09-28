import dotenv from "dotenv";
import getGrowwAccessToken from "./getGrowwAccessToken.js";

// Load environment variables
dotenv.config();

console.log("🧪 Testing Groww Access Token with Database Caching...\n");

async function testTokenCaching() {
  try {
    console.log("1️⃣ Getting first token (should generate new)...");
    const token1 = await getGrowwAccessToken();
    console.log("Token 1 received:", token1 ? "✅ Success" : "❌ Failed");

    console.log("\n2️⃣ Getting second token (should use cached)...");
    const token2 = await getGrowwAccessToken();
    console.log("Token 2 received:", token2 ? "✅ Success" : "❌ Failed");

    console.log("\n📊 Token comparison:");
    console.log(
      "Tokens are same:",
      token1 === token2 ? "✅ Cached correctly" : "❌ Not cached"
    );

    if (token1) {
      console.log("Token preview:", token1.substring(0, 50) + "...");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testTokenCaching()
  .then(() => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
