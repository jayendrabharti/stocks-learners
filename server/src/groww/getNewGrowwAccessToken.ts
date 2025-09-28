import { createHash } from "crypto";
import { authenticator } from "otplib";

export interface GrowwTokenResponse {
  success: boolean;
  access_token: string | null;
  error: string | null;
}

export interface GrowwAPIError {
  code: string;
  message: string;
}

export class GrowwAPIException extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GrowwAPIException";
    this.code = code;
  }
}

/**
 * TypeScript implementation of Groww API token generation
 * Replicated from the Python growwapi library
 */
export class GrowwAPI {
  private static readonly API_URL = "https://api.groww.in/v1/token/api/access";
  private static readonly CLIENT_ID = "growwapi";
  private static readonly CLIENT_PLATFORM = "growwapi-typescript-client";
  private static readonly CLIENT_PLATFORM_VERSION = "1.0.0";
  private static readonly API_VERSION = "1.0";

  private static readonly ERROR_MAP: Record<number, () => GrowwAPIException> = {
    401: () =>
      new GrowwAPIException("401", "Unauthorized: Invalid API key or token"),
    403: () => new GrowwAPIException("403", "Forbidden: Access denied"),
    404: () => new GrowwAPIException("404", "Not Found: Resource not found"),
    429: () =>
      new GrowwAPIException("429", "Too Many Requests: Rate limit exceeded"),
    500: () => new GrowwAPIException("500", "Internal Server Error"),
    502: () => new GrowwAPIException("502", "Bad Gateway"),
    503: () => new GrowwAPIException("503", "Service Unavailable"),
    504: () => new GrowwAPIException("504", "Gateway Timeout"),
  };

  /**
   * Get access token from Groww API
   * @param apiKey Bearer token or API key for the Authorization header
   * @param totp TOTP code as a string (if using TOTP authentication)
   * @param secret Secret value as a string (if using approval authentication)
   * @returns Promise<string> The access token
   */
  public static async getAccessToken(
    apiKey: string,
    totp?: string,
    secret?: string
  ): Promise<string> {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer${apiKey}`,
      "x-client-id": this.CLIENT_ID,
      "x-client-platform": this.CLIENT_PLATFORM,
      "x-client-platform-version": this.CLIENT_PLATFORM_VERSION,
      "x-api-version": this.API_VERSION,
    };

    const data = this._buildRequestData(totp, secret);

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      // Handle 400 Bad Request specifically
      if (response.status === 400) {
        let msg = "Bad Request";
        try {
          const errorResponse = await response.json();
          msg = (errorResponse as any)?.error?.displayMessage || "Bad Request";
        } catch {
          // If JSON parsing fails, use default message
        }
        throw new GrowwAPIException("400", `Groww API Error 400: ${msg}`);
      }

      // Handle other known error status codes
      if (response.status in this.ERROR_MAP) {
        const errorFactory = this.ERROR_MAP[response.status];
        if (errorFactory) {
          throw errorFactory();
        }
      }

      // Handle any other non-OK responses
      if (!response.ok) {
        throw new GrowwAPIException(
          response.status.toString(),
          "The request to the Groww API failed."
        );
      }

      const result = (await response.json()) as { token: string };
      return result.token;
    } catch (error) {
      if (error instanceof GrowwAPIException) {
        throw error;
      }

      // Handle network errors, timeouts, etc.
      throw new GrowwAPIException(
        "NETWORK_ERROR",
        `Network error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Builds the request data payload based on authentication method
   * @param totp TOTP code (optional)
   * @param secret Secret value (optional)
   * @returns Request data object
   */
  private static _buildRequestData(totp?: string, secret?: string): object {
    // Validation: both or neither provided
    if (totp !== undefined && secret !== undefined) {
      throw new ValueError(
        "Either totp or secret should be provided, not both."
      );
    }
    if (totp === undefined && secret === undefined) {
      throw new ValueError("Either totp or secret should be provided.");
    }

    // TOTP authentication
    if (totp !== undefined) {
      if (!totp.trim()) {
        throw new ValueError("TOTP cannot be empty");
      }

      return {
        key_type: "totp",
        totp: totp.trim(),
      };
    }

    // Approval authentication (secret is not undefined)
    if (!secret!.trim()) {
      throw new ValueError("Secret cannot be empty");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const checksum = this._generateChecksum(secret!, timestamp.toString());

    return {
      key_type: "approval",
      checksum,
      timestamp,
    };
  }

  /**
   * Generates a SHA-256 checksum for the given data and salt
   * @param data The API secret value
   * @param salt The salt value (timestamp)
   * @returns Hexadecimal SHA-256 checksum
   */
  private static _generateChecksum(data: string, salt: string): string {
    const inputStr = data + salt;
    return createHash("sha256").update(inputStr, "utf-8").digest("hex");
  }
}

/**
 * Custom ValueError class to match Python's ValueError
 */
export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}

/**
 * Generate TOTP code from secret
 * @param secret The TOTP secret
 * @returns Current TOTP code
 */
export function generateTOTP(secret: string): string {
  return authenticator.generate(secret);
}

/**
 * Main function to get new Groww access token
 * Uses environment variables for API credentials
 * @returns Promise<GrowwTokenResponse>
 */
export async function getNewGrowwAccessToken(): Promise<GrowwTokenResponse> {
  try {
    // Get credentials from environment variables
    const apiKey = process.env.GROWW_API_KEY;
    const apiSecret = process.env.GROWW_API_SECRET;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        access_token: null,
        error:
          "GROWW_API_KEY and GROWW_API_SECRET environment variables are required",
      };
    }

    // Generate TOTP code
    const totp = generateTOTP(apiSecret);

    // Get access token
    const accessToken = await GrowwAPI.getAccessToken(apiKey, totp);

    return {
      success: true,
      access_token: accessToken,
      error: null,
    };
  } catch (error) {
    let errorMessage = "Unknown error occurred";

    if (error instanceof GrowwAPIException) {
      errorMessage = `${error.code}: ${error.message}`;
    } else if (error instanceof ValueError) {
      errorMessage = `Validation Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      access_token: null,
      error: errorMessage,
    };
  }
}

/**
 * Test function to verify the setup
 */
export async function testGrowwToken(): Promise<void> {
  console.log("🧪 Testing Groww API Token Generation...");

  const result = await getNewGrowwAccessToken();

  if (result.success) {
    console.log("✅ Access token obtained successfully:", result.access_token);
  } else {
    console.error("❌ Failed to get access token:", result.error);
  }
}
