import { AdminSidebar } from "@/components/organisms/SideBar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell flex h-[calc(100vh-4rem)] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6">{children}</div>
    </div>
  );
}
