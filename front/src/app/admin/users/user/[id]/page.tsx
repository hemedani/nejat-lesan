import { getUser } from "@/app/actions/user/getUser";
import UserProfileCard from "@/components/organisms/user/UserProfileCard";

const Page = async ({ params, }: { params: Promise<{ id: string }> }) => {
  const _id = (await params).id;
  const { body, success } = await getUser(_id);

  return (
    <>
      {success ? (
        <UserProfileCard user={body} isAdminContext={true} />
      ) : (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          مشکلی در دریافت اطلاعات کاربر وجود دارد - {body.message}
        </div>
      )}
    </>
  );
};

export default Page;
