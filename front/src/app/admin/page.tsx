import AdminDashboard from "@/components/template/AdminDashboard";
import { getCounts } from "@/app/actions/user/dashboardStatistic";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const data = await getCounts();
  const token = (await cookies()).get("token");
  const lesanUrl = process.env.LESAN_URL
    ? process.env.LESAN_URL
    : "http://localhost:1404";

  return (
    <AdminDashboard data={data} token={token?.value} lesanUrl={lesanUrl} />
  );
}
