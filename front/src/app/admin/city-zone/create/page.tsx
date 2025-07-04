import { FormCreateCityZone } from "@/components/template/FormCreateCityZone";
import { cookies } from "next/headers";
import Link from "next/link";

const Page = async () => {
  const token = (await cookies()).get("token");
  const lesanUrl = process.env.LESAN_URL ? process.env.LESAN_URL : "http://localhost:1382"
  return (
    <div className="p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-700">ایجاد منطقه شهری جدید</h1>
        <Link
          href="/admin/city-zone"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          بازگشت به لیست
        </Link>
      </div>
      <FormCreateCityZone token={token?.value} lesanUrl={lesanUrl} />
    </div>
  );
};

export default Page;
