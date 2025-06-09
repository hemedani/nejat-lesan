import { AdminSidebar } from "@/components/organisms/SideBar";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 bg-gray-100 overflow-auto">
        {children}
      </div>
    </div>
  );
}
