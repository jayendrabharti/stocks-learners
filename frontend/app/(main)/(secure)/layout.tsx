import AuthGuard from "@/auth/AuthGuard";
import Unauthenticated from "@/components/auth/Unauthenticated";
import { WatchlistProvider } from "@/providers/WatchlistProvider";
import { ReactNode } from "react";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard fallback={<Unauthenticated />}>
      <WatchlistProvider>{children}</WatchlistProvider>
    </AuthGuard>
  );
}
