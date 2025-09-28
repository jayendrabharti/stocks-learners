import Footer from "@/components/Footer";
import Main from "@/components/Main";
import NavBar from "@/components/NavBar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <NavBar />
      <Main
        className={cn(
          "flex h-full min-h-0 w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto",
        )}
      >
        {children}
        <Footer />
      </Main>
    </>
  );
}
