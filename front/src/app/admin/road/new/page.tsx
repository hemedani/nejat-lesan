import RoadForm from "@/components/road/RoadForm";

export default function NewRoadPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-fg">افزودن جاده</h1>
      <p className="mb-5 text-sm text-fg-faint">
        نام، استان و محور جاده الزامی است؛ طول به‌طور خودکار از روی محور
        محاسبه می‌شود.
      </p>
      <RoadForm road={null} />
    </div>
  );
}
