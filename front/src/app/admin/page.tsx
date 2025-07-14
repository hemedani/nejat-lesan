import AdminDashboard from "@/components/template/AdminDashboard";
import { getCounts } from "@/app/actions/user/dashboardStatistic";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const data = await getCounts();
  const token = (await cookies()).get("token");

  return <AdminDashboard data={data} token={token?.value} />;
}
