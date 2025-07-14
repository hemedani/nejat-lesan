import { FormCreateUser } from "@/components/template/FormCreateUser";
import { cookies } from "next/headers";
import Link from "next/link";

const Page = async () => {
  const token = (await cookies()).get("token");

  return (
    <div className="p-6 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-700">ایجاد کاربر جدید</h1>
        <Link
          href="/admin/users"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          بازگشت به لیست
        </Link>
      </div>
      <FormCreateUser token={token?.value} />
    </div>
  );
};

export default Page;
