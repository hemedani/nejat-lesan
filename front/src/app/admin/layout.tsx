import { AdminSidebar } from "@/components/organisms/SideBar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">{children}</div>
    </div>
  );
}
