import OrganizationForm from "@/components/org/OrganizationForm";

export default function NewOrganizationPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">افزودن سازمان</h1>
      <p className="mb-5 text-sm text-slate-500">
        هر راه یا شهرداری یک سازمان است. مرکز عملیاتی اختیاری است ولی قاب نقشهٔ
        اپلیکیشن مأمور را تعیین می‌کند.
      </p>
      <OrganizationForm organization={null} />
    </div>
  );
}
