import ClientCommonModelDashboard from "@/components/template/clientCommonModelDashboard";
import SearchBox from "@/components/molecules/SearchBox";
import Pagination from "@/components/molecules/Pagination";
import { ReqType } from "@/types/declarations/selectInp";
import { gets } from "@/app/actions/motion_direction/gets";
import { count } from "@/app/actions/motion_direction/count";
import { remove } from "@/app/actions/motion_direction/remove";
import { add } from "@/app/actions/motion_direction/add";
import { update } from "@/app/actions/motion_direction/update";
import { translateModelNameToPersian } from "@/utils/helper";

export default async function AirStatusDashboard({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["motion_direction"]["gets"]["set"]>;
}) {
  const { limit = "20", page = "1", name } = await searchParams;

  const set: ReqType["main"]["motion_direction"]["gets"]["set"] = {
    limit: +limit || 20,
    page: +page,
    name,
  };
  const get: ReqType["main"]["motion_direction"]["gets"]["get"] = {
    _id: 1,
    name: 1,
  };

  const data = await gets({ set, get });
  const counted = await count({
    set: set.name ? { name: set.name } : {},
    get: { qty: 1 },
  });

  return (
    <div className="relative min-h-full">
      <div className="flex items-start">
        <div className="bg-blue-500 w-1 h-8 ml-3 rounded-full"></div>
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            {translateModelNameToPersian("motion_direction")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت {translateModelNameToPersian("motion_direction")}
          </p>
        </div>
      </div>
      <SearchBox title="name" defaultValue={name} />
      <ClientCommonModelDashboard data={data.success ? data.body : []} model="motion_direction" remove={remove} add={add} update={update} />
      <Pagination countPage={counted?.body.qty} initialPage={+page} />
    </div>
  );
}
