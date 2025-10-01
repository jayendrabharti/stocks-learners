/**
 * ⚠️ DEPRECATED - This Next.js API route is no longer used
 *
 * Search functionality has been moved to the backend:
 * Backend: GET /instruments/search
 *
 * This file can be safely deleted.
 * Kept temporarily for reference during migration.
 *
 * Date Deprecated: October 1, 2025
 * Replaced By: server/src/controllers/instruments.controller.ts → globalSearch()
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const from = searchParams.get("from") || "0";
    const size = searchParams.get("size") || "6";
    const web = searchParams.get("web") || "true";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    // Make request to Groww API from server-side (no CORS issues)
    const growwResponse = await fetch(
      `https://groww.in/v1/api/search/v3/query/global/st_query?from=${from}&query=${encodeURIComponent(query)}&size=${size}&web=${web}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      },
    );

    if (!growwResponse.ok) {
      throw new Error(
        `Groww API responded with status: ${growwResponse.status}`,
      );
    }

    const data = await growwResponse.json();

    // Return the data with CORS headers for our frontend
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error proxying Groww API:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Groww API" },
      { status: 500 },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
