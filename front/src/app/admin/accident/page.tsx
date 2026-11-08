import { Suspense } from "react";
import Link from "next/link";
import { ReqType } from "@/types/declarations/selectInp";
import { count } from "@/app/actions/accident/count";
import { remove } from "@/app/actions/accident/remove";
import { removeByCreatedAt } from "@/app/actions/accident/removeByCreatedAt";
import { add } from "@/app/actions/accident/add";
import { update } from "@/app/actions/accident/update";
import { translateModelNameToPersian } from "@/utils/helper";
import AccidentDashboard from "@/components/template/AccidentDashboard";
import AccidentStatCards from "@/components/organisms/AccidentStatCards";
import AccidentFilterBar from "@/components/organisms/accident/AccidentFilterBar";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { prepareAccidentsSearch } from "@/utils/prepareAccidentSearch";

export default async function AccidentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["accident"]["gets"]["set"]>;
}) {
  const actualSearchParams = await searchParams;
  const { accidents, setSearch } = await prepareAccidentsSearch(
    actualSearchParams,
  );

  const countFilters = { ...setSearch };
  delete countFilters.page;
  delete countFilters.limit;

  const counted = await count({
    set: countFilters,
    get: { filtered: 1, total: 1 },
  });

  const totalCount = counted?.body.total || 0;
  const filteredCount = counted?.body.filtered || 0;
  const currentPage = +setSearch.page!;
  const pageSize = +setSearch.limit!;

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{ backgroundImage: "var(--hero-gradient)" }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="tint-rose flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint-strong text-tint-fg">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 001.74-2.99l-7.07-12.02a2 2 0 00-3.48 0L3.19 16.01A2 2 0 004.93 19z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-fg sm:text-3xl">
                {translateModelNameToPersian("accident")}
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                مدیریت، جستجو و تحلیل تصادفات ثبت‌شده
              </p>
            </div>
          </div>

          <Link
            href="/admin/accident/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand shadow-md transition-all hover:bg-brand-hover hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-line-focus focus:ring-offset-2 focus:ring-offset-surface"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            افزودن حادثه جدید
          </Link>
        </div>
      </header>

      <AccidentStatCards
        totalCount={totalCount}
        filteredCount={filteredCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />

      <Suspense
        fallback={
          <div className="h-[92px] animate-pulse rounded-2xl border border-line bg-surface" />
        }
      >
        <AccidentFilterBar
          pageAddress="/admin/accident"
          totalCount={totalCount}
          filteredCount={filteredCount}
        />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <AccidentDashboard
          data={accidents.success ? accidents.body : []}
          model="accident"
          remove={remove}
          removeByCreatedAt={removeByCreatedAt}
          add={add}
          update={update}
          totalCount={filteredCount}
          currentPage={currentPage}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  );
}
