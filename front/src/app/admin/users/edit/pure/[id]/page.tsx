import { getUser } from "@/app/actions/user/getUser";
import { EditUserPures } from "@/components/organisms/user/EditUserPures";
import Link from "next/link";

const FormComponent = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const id = (await params).id;

  const foundedUser = await getUser(id)
  const lesanUrl = process.env.LESAN_URL ? process.env.LESAN_URL : "http://localhost:1382"

  return (
    <>
      {foundedUser.success ? (
        <div className="p-6 min-h-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-fg">ویرایش «{foundedUser.body.first_name} {foundedUser.body.last_name}»</h1>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-surface-hover text-fg rounded-lg hover:bg-surface-sunken transition-colors"
            >
              بازگشت به لیست
            </Link>
          </div>
          <EditUserPures {...foundedUser.body} lesanUrl={lesanUrl} />
        </div>
      ) : (
        <div>
          مشکلی در یافتن کاربر وجود دارد - {foundedUser.body.message}

          <Link
            href="/admin/users"
            className="px-6 py-3 bg-brand text-on-brand rounded-md hover:bg-brand-hover transition"
          >
            بازگشت
          </Link>

        </div>
      )}
    </>
  );
};

export default FormComponent;
