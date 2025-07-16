import { Suspense } from "react";
import FormCreateAccident from "@/components/template/FormCreateAccident";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";

export default function CreateAccidentPage() {
  return (
    <div className="relative min-h-full bg-gray-50 p-6">
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <FormCreateAccident />
      </Suspense>
    </div>
  );
}
