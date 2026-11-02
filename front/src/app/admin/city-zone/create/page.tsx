import { AUTH_COOKIE } from "@/utils/auth-constants";
import { FormCreateCityZone } from "@/components/template/FormCreateCityZone";
import { cookies } from "next/headers";
import Link from "next/link";

const Page = async () => {
  const token = (await cookies()).get(AUTH_COOKIE);
  const lesanUrl = process.env.LESAN_URL ? process.env.LESAN_URL : "http://localhost:1382"
  return (
    <div className="p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">ایجاد منطقه شهری جدید</h1>
        <Link
          href="/admin/city-zone"
          className="px-4 py-2 bg-surface-hover text-fg rounded-lg hover:bg-surface-sunken transition-colors"
        >
          بازگشت به لیست
        </Link>
      </div>
      <FormCreateCityZone token={token?.value} lesanUrl={lesanUrl} />
    </div>
  );
};

export default Page;
