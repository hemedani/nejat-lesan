import { CountUsers } from "@/app/actions/user/countUsers";
import { getUsers } from "@/app/actions/user/getUsers";
import Pagination from "@/components/molecules/Pagination";
import ClientUserDashboard from "@/components/template/clientUserDashboard";
import { UserFilters } from "@/components/organisms/user/UserFilters";
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
    father_name: 1,
    mobile: 1,
    email: 1,
    gender: 1,
    national_number: 1,
    level: 1,
    is_verified: 1,
    summary: 1,
    personnel_code: 1,
    is_active: 1,
  };
  const users = await getUsers({ set, get });
  const countDataUsers = await CountUsers({
    set: { levels: levels },
    get: { qty: 1 },
  });
  return (
    <div className="relative min-h-full pb-8">
      <div className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-blue-300">مرکز مدیریت دسترسی</p><h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">کاربران سامانه</h1><p className="mt-2 text-sm text-slate-400">ایجاد، بررسی و مدیریت حساب‌های کاربری و مأموران گشت</p></div>
        <div className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3"><span className="text-xs text-blue-200">تعداد نمایش</span><strong className="text-xl text-white">{Number(countDataUsers.qty || 0).toLocaleString("fa-IR")}</strong></div>
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-xl"><UserFilters /></div>
      <ClientUserDashboard searchQuery="" users={users} />
      <Pagination countPage={countDataUsers.qty} initialPage={+page} />
    </div>
  );
};

export default UserDashboard;
