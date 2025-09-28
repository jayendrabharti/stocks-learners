# Groww API TypeScript Implementation

A pure TypeScript implementation of the Groww API token generation, replicated from the official Python `growwapi` library.

## 🚀 Features

- ✅ **Pure TypeScript** - No Python dependencies
- ✅ **Direct API Implementation** - Replicated from Python source code
- ✅ **TOTP Support** - Built-in TOTP generation using `otplib`
- ✅ **Approval Auth Support** - SHA-256 checksum generation for approval method
- ✅ **Comprehensive Error Handling** - Matches Python library error responses
- ✅ **Environment Variable Support** - Secure credential management
- ✅ **Backend Only** - No API endpoints exposed for security

## 📦 Installation

Dependencies are automatically installed:

- `otplib` - For TOTP generation
- `@types/node` - Node.js type definitions

```bash
npm install  # Already includes required dependencies
```

## ⚙️ Configuration

Add your Groww API credentials to your `.env` file:

```env
GROWW_API_KEY=your_groww_api_key_here
GROWW_API_SECRET=your_groww_api_secret_here
```

## 📖 Usage

### Basic Usage

```typescript
import { getNewGrowwAccessToken } from "./groww/getNewGrowwAccessToken.js";

// Get access token
const result = await getNewGrowwAccessToken();

if (result.success) {
  console.log("Access Token:", result.access_token);
  // Use the token for your API calls
} else {
  console.error("Error:", result.error);
}
```

### Advanced Usage - Direct API Call

```typescript
import { GrowwAPI, generateTOTP } from "./groww/getNewGrowwAccessToken.js";

const apiKey = process.env.GROWW_API_KEY!;
const apiSecret = process.env.GROWW_API_SECRET!;

// Generate TOTP
const totp = generateTOTP(apiSecret);

// Get access token directly
try {
  const token = await GrowwAPI.getAccessToken(apiKey, totp);
  console.log("Token:", token);
} catch (error) {
  console.error("API Error:", error);
}
```

### Using Approval Authentication (Alternative to TOTP)

```typescript
import { GrowwAPI } from "./groww/getNewGrowwAccessToken.js";

const apiKey = process.env.GROWW_API_KEY!;
const secret = process.env.GROWW_API_SECRET!;

try {
  // Use secret instead of TOTP
  const token = await GrowwAPI.getAccessToken(apiKey, undefined, secret);
  console.log("Token:", token);
} catch (error) {
  console.error("API Error:", error);
}
```

## 🧪 Testing

Test the implementation:

```bash
npm run test:groww
```

## 📁 Implementation Details

### API Endpoint

```
POST https://api.groww.in/v1/token/api/access
```

### Headers

- `Content-Type: application/json`
- `Authorization: Bearer{api_key}`
- `x-client-id: growwapi`
- `x-client-platform: growwapi-typescript-client`
- `x-client-platform-version: 1.0.0`
- `x-api-version: 1.0`

### Authentication Methods

#### 1. TOTP Authentication

```json
{
  "key_type": "totp",
  "totp": "123456"
}
```

#### 2. Approval Authentication

```json
{
  "key_type": "approval",
  "checksum": "sha256_hex_checksum",
  "timestamp": 1632456789
}
```

### Response Format

```typescript
interface GrowwTokenResponse {
  success: boolean;
  access_token: string | null;
  error: string | null;
}
```

## 🛠️ Core Classes & Functions

### `GrowwAPI` Class

Main class with static methods for API interaction:

- `getAccessToken(apiKey, totp?, secret?)` - Get access token
- `_buildRequestData(totp?, secret?)` - Build request payload
- `_generateChecksum(data, salt)` - Generate SHA-256 checksum

### `generateTOTP(secret)` Function

Generate current TOTP code from secret using `otplib`.

### `getNewGrowwAccessToken()` Function

Main convenience function that uses environment variables.

## 🔐 Security Features

- **No API Endpoints** - Backend-only implementation
- **Environment Variables** - Secure credential storage
- **Error Sanitization** - Safe error message handling
- **Request Timeout** - 15-second timeout for API calls
- **Proper Headers** - All required headers for API compatibility

## ❌ Error Handling

The implementation handles all error scenarios from the original Python library:

- **400 Bad Request** - Invalid credentials or malformed request
- **401 Unauthorized** - Invalid API key or token
- **403 Forbidden** - Access denied
- **404 Not Found** - Resource not found
- **429 Too Many Requests** - Rate limit exceeded
- **5xx Server Errors** - Groww server issues
- **Network Errors** - Connection timeouts, etc.
- **Validation Errors** - Empty TOTP/secret, both provided, etc.

## 🔄 Migration from Python

If you were using the Python version, the TypeScript version provides identical functionality:

**Python:**

```python
from growwapi import GrowwAPI
import pyotp

api_key = "YOUR_API_KEY"
totp_gen = pyotp.TOTP('YOUR_API_SECRET')
totp = totp_gen.now()

access_token = GrowwAPI.get_access_token(api_key, totp)
```

**TypeScript:**

```typescript
import { GrowwAPI, generateTOTP } from "./groww/getNewGrowwAccessToken.js";

const apiKey = "YOUR_API_KEY";
const totp = generateTOTP("YOUR_API_SECRET");

const accessToken = await GrowwAPI.getAccessToken(apiKey, totp);
```

## 📊 Performance

- **No Python overhead** - Direct TypeScript implementation
- **Fast execution** - No subprocess spawning
- **Memory efficient** - Single process execution
- **Better error handling** - Immediate error feedback

## 🤝 Compatibility

- **Node.js 16+** - ES2022 target with modern features
- **TypeScript 4.5+** - Full type safety
- **ESM modules** - Modern module system
- **Cross-platform** - Works on Windows, Linux, macOS
