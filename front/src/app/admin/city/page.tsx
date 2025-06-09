import ClientCommonModelDashboard from "@/components/template/clientCommonModelDashboard";
import SearchBox from "@/components/molecules/SearchBox";
import Pagination from "@/components/molecules/Pagination";
import { ReqType } from "@/types/declarations/selectInp";
import { gets } from "@/app/actions/city/gets";
import { count } from "@/app/actions/city/count";
import { remove } from "@/app/actions/city/remove";
import { add } from "@/app/actions/city/add";
import { update } from "@/app/actions/city/update";
import { translateModelNameToPersian } from "@/utils/helper";

export default async function AirStatusDashboard({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["city"]["gets"]["set"]>;
}) {
  const { limit = "20", page = "1", name } = await searchParams;

  const set: ReqType["main"]["city"]["gets"]["set"] = {
    limit: +limit || 20,
    page: +page,
    name,
  };
  const get: ReqType["main"]["city"]["gets"]["get"] = {
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
            {translateModelNameToPersian("city")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت {translateModelNameToPersian("city")}
          </p>
        </div>
      </div>
      <SearchBox title="name" defaultValue={name} />
      <ClientCommonModelDashboard data={data.success ? data.body : []} model="city" remove={remove} add={add} update={update} />
      <Pagination countPage={counted?.body.qty} initialPage={+page} />
    </div>
  );
}
