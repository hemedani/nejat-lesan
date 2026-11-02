"use client";

interface AccidentStatCardsProps {
  totalCount: number;
  recentCount: number;
}

const AccidentStatCards: React.FC<AccidentStatCardsProps> = ({ totalCount, recentCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-surface rounded-xl shadow-sm p-6 border-r-4 border-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-fg-muted mb-1">کل تصادفات</p>
            <h3 className="text-3xl font-bold text-fg">{totalCount.toLocaleString('fa-IR')}</h3>
          </div>
          <div className="bg-brand-soft p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border-r-4 border-red-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-fg-muted mb-1">تصادفات اخیر (۳۰ روز)</p>
            <h3 className="text-3xl font-bold text-fg">{recentCount.toLocaleString('fa-IR')}</h3>
          </div>
          <div className="bg-danger-soft p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-danger-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border-r-4 border-amber-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-fg-muted mb-1">میانگین مجروحین</p>
            <h3 className="text-3xl font-bold text-fg">۲.۴</h3>
          </div>
          <div className="bg-warning-soft p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-warning-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm p-6 border-r-4 border-green-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-fg-muted mb-1">تصادفات با شاهد</p>
            <h3 className="text-3xl font-bold text-fg">۶۵٪</h3>
          </div>
          <div className="bg-success-soft p-3 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-success-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentStatCards;