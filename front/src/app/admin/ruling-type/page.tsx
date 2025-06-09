import ClientCommonModelDashboard from "@/components/template/clientCommonModelDashboard";
import SearchBox from "@/components/molecules/SearchBox";
import Pagination from "@/components/molecules/Pagination";
import { ReqType } from "@/types/declarations/selectInp";
import { gets } from "@/app/actions/ruling_type/gets";
import { count } from "@/app/actions/ruling_type/count";
import { remove } from "@/app/actions/ruling_type/remove";
import { add } from "@/app/actions/ruling_type/add";
import { update } from "@/app/actions/ruling_type/update";
import { translateModelNameToPersian } from "@/utils/helper";

export default async function AirStatusDashboard({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["ruling_type"]["gets"]["set"]>;
}) {
  const { limit = "20", page = "1", name } = await searchParams;

  const set: ReqType["main"]["ruling_type"]["gets"]["set"] = {
    limit: +limit || 20,
    page: +page,
    name,
  };
  const get: ReqType["main"]["ruling_type"]["gets"]["get"] = {
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
            {translateModelNameToPersian("ruling_type")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت {translateModelNameToPersian("ruling_type")}
          </p>
        </div>
      </div>
      <SearchBox title="name" defaultValue={name} />
      <ClientCommonModelDashboard data={data.success ? data.body : []} model="ruling_type" remove={remove} add={add} update={update} />
      <Pagination countPage={counted?.body.qty} initialPage={+page} />
    </div>
  );
}
