"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/providers/SessionProvider";
import { ShieldAlert, Home, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useSession();
  const router = useRouter();

  // Only redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/admin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show access denied UI if authenticated but not admin
  if (status === "authenticated" && !user?.isAdmin) {
    return (
      <div className="via-background dark:via-background flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4 dark:from-red-950/20 dark:to-orange-950/20">
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
              <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="mb-3 text-2xl font-bold text-red-600 dark:text-red-400">
            Access Denied
          </h1>

          <p className="mb-2 text-lg font-semibold">Admin Access Required</p>

          <p className="text-muted-foreground mb-6">
            This area is restricted to administrators only. You don't have the
            necessary permissions to access this page.
          </p>

          <div className="bg-muted/50 mb-6 rounded-lg border p-4">
            <p className="text-sm">
              <span className="font-medium">Current User:</span>{" "}
              {user?.email || "Unknown"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Contact your administrator if you believe this is an error.
            </p>
          </div>

          <Button onClick={() => router.push("/")} className="w-full" size="lg">
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
