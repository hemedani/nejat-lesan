import { getUser } from "@/app/actions/user/getUser";
import { EditUserRelations } from "@/components/organisms/user/EditUserRelations";
import Link from "next/link";

const FormComponent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const id = (await params).id;

  const foundedUser = await getUser(id);

  return (
    <>
      {foundedUser.success ? (
        <div className="p-6 min-h-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-700">
              ویرایش رابطه‌های «{foundedUser.body.first_name}{" "}
              {foundedUser.body.last_name}»
            </h1>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              بازگشت به لیست
            </Link>
          </div>
          <EditUserRelations {...foundedUser.body} />
        </div>
      ) : (
        <div>
          مشکلی در یافتن کاربر وجود دارد - {foundedUser.body.message}
          <Link
            href="/admin/users"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            بازگشت
          </Link>
        </div>
      )}
    </>
  );
};

export default FormComponent;
