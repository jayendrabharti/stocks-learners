"use client";
import Authenticated from "@/components/auth/Authenticated";
import AuthHeader from "@/components/auth/AuthHeader";
import Main from "@/components/Main";
import { useSession } from "@/providers/SessionProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useSession();
  const isAuthenticated = status === "authenticated" && user;

  return (
    <Main className="bg-background text-foreground grid h-dvh min-h-dvh w-full grid-rows-[auto_1fr]">
      <AuthHeader />
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        {isAuthenticated ? <Authenticated /> : children}
      </div>
    </Main>
  );
}
