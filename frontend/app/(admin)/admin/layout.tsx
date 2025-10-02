import AdminGuard from "@/components/admin/AdminGuard";
import { AppSidebar } from "@/components/admin/AppSidebar";
import Main from "@/components/Main";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b backdrop-blur">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </div>
          </header>
          <Main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </Main>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  );
}
