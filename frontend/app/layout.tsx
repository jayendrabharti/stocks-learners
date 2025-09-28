import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/providers/DataProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";
import SessionProvider from "@/providers/SessionProvider";

export const metadata: Metadata = {
  title: "Stocks Learners",
  description: "Learn stock trading with Stocks Learners",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
      <body className={cn("flex h-full w-full flex-col overflow-hidden")}>
        <SessionProvider>
          <DataProvider>
            <ThemeProvider defaultTheme="light">
              {children}
              <Toaster richColors />
            </ThemeProvider>
          </DataProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
