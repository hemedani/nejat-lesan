import { AUTH_COOKIE } from "@/utils/auth-constants";
import AdminDashboard from "@/components/template/AdminDashboard";
import { getCounts } from "@/app/actions/user/dashboardStatistic";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const data = await getCounts();
  const token = (await cookies()).get(AUTH_COOKIE);

  return <AdminDashboard data={data} token={token?.value} />;
}
