import { CountUsers } from "@/app/actions/user/countUsers";
import { getUsers } from "@/app/actions/user/getUsers";
import Pagination from "@/components/molecules/Pagination";
import SearchBox from "@/components/molecules/SearchBox";
import ClientUserDashboard from "@/components/template/clientUserDashboard";
import { ReqType } from "@/types/declarations/selectInp";

const UserDashboard = async ({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["user"]["getUsers"]["set"]>;
}) => {
  const { limit = "20", page = "1", levels } = await searchParams;
  const set: ReqType["main"]["user"]["getUsers"]["set"] = {
    limit: +limit || 20,
    page: +page,
    levels,
  };

  const get: ReqType["main"]["user"]["getUsers"]["get"] = {
    _id: 1,
    first_name: 1,
    last_name: 1,
    level: 1,
  };
  const users = await getUsers({ set, get });
  const countDataUsers = await CountUsers({
    set: { levels: levels },
    get: { qty: 1 },
  });
  return (
    <div className="relative min-h-full">
      <div className="flex items-start">
        <div className="bg-blue-500 w-1 h-8 ml-3 rounded-full"></div>
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            کاربران
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت تمامی کاربران وب‌سایت
          </p>
        </div>
      </div>
      <SearchBox title="levels" defaultValue="" />
      <ClientUserDashboard searchQuery="" users={users} />
      <Pagination countPage={countDataUsers.qty} initialPage={+page} />
    </div>
  );
};

export default UserDashboard;
