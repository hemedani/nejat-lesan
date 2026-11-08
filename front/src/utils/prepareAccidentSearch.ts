import { DeepPartial, ReqType } from "@/types/declarations/selectInp";
import { GetAccidentsSetParams, populateSetSearch } from "./populateSetSearch";
import { gets } from "@/app/actions/accident/gets";

/**
 * Builds the backend `gets` request for the accident list.
 *
 * Filter values travel in the URL as names, which is also what the advanced
 * search multi-selects render, so no second round-trip is needed to translate
 * selected rows back into options.
 */
export const prepareAccidentsSearch = async (
  searchParams: GetAccidentsSetParams,
) => {
  const setSearch: DeepPartial<GetAccidentsSetParams> =
    populateSetSearch(searchParams);

  const accidents = await gets({
    set: {
      ...setSearch,
      page: +(searchParams.page || 1) || 1,
      limit: +(searchParams.limit || 20) || 20,
    } as ReqType["main"]["accident"]["gets"]["set"],
    get: {
      _id: 1,
      seri: 1,
      serial: 1,
      date_of_accident: 1,
      dead_count: 1,
      injured_count: 1,
      has_witness: 1,
      province: { name: 1 },
      city: { name: 1 },
      township: { name: 1 },
      type: { name: 1 },
      collision_type: { name: 1 },
      vehicle_dtos: 1,
      attachments: { _id: 1, name: 1, type: 1, path: 1 },
    },
  });

  return { setSearch, accidents };
};
