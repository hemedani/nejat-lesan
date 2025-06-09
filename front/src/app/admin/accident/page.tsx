import { Suspense } from "react";
import { ReqType } from "@/types/declarations/selectInp";
import { count } from "@/app/actions/accident/count";
import { remove } from "@/app/actions/accident/remove";
import { add } from "@/app/actions/accident/add";
import { update } from "@/app/actions/accident/update";
import { translateModelNameToPersian } from "@/utils/helper";
import AccidentDashboard from "@/components/template/AccidentDashboard";
import AccidentStatCards from "@/components/organisms/AccidentStatCards";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import ToggleAdvancedSearch from "@/components/molecules/ToggleAdvancedSearch";
import { prepareAccidentsSearch } from "@/utils/prepareAccidentSearch";

export default async function AccidentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["accident"]["gets"]["set"]>;
}) {
  const actualSearchParams = await searchParams;
  const { defaultSearchArrayValues, accidents, setSearch } =
    await prepareAccidentsSearch(actualSearchParams);

  const counted = await count({
    set: {}, // Count all records for statistics
    get: { qty: 1 },
  });

  // Get statistics for dashboard
  const statsSet = {
    // date_from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
  };

  const recentStats = await count({
    set: statsSet,
    get: { qty: 1 },
  });

  return (
    <div className="relative min-h-full bg-gray-50 p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <div className="bg-red-500 w-2 h-12 mr-4 rounded-full"></div>
          <div>
            <h1 className="text-3xl md:text-4xl text-gray-800 font-bold">
              {translateModelNameToPersian("accident")}
            </h1>
            <p className="text-gray-500 mt-1">
              سیستم مدیریت و تحلیل {translateModelNameToPersian("accident")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense
        fallback={
          <div className="h-32 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <AccidentStatCards
          totalCount={counted?.body.qty || 0}
          recentCount={recentStats?.body.qty || 0}
        />
      </Suspense>

      {/* Search Filters */}
      <div className="bg-white p-5 rounded-lg shadow-sm mb-8 hover:shadow-md transition-all duration-300 ease-in-out border border-gray-100">
        <div className="flex items-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-700">
            جستجوی پیشرفته
          </h2>
        </div>
        <ToggleAdvancedSearch
          defaultSearchArrayValues={defaultSearchArrayValues}
          pageAddress="articles"
        />
      </div>

      {/* Main Dashboard */}
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <AccidentDashboard
          data={accidents.success ? accidents.body : []}
          model="accident"
          remove={remove}
          add={add}
          update={update}
          totalCount={counted?.body.qty || 0}
          currentPage={+setSearch.page!}
          pageSize={+setSearch.limit!}
        />
      </Suspense>
    </div>
  );
}
