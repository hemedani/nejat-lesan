import React, { useState } from "react";
import { FieldValues, UseFormTrigger } from "react-hook-form";

interface Step {
  id: string;
  title: string;
  component: React.ReactNode;
}

interface MultiStepFormProps<T extends FieldValues = FieldValues> {
  steps: Step[];
  getFormData: () => T;
  onSubmit: (data: T) => void;
  isSubmitting: boolean;
  triggerValidation: UseFormTrigger<T>;
  isEnterprise?: boolean;
}

const MultiStepForm = <T extends FieldValues = FieldValues>({
  steps,
  getFormData,
  onSubmit,
  isSubmitting,
  triggerValidation,
  isEnterprise = false,
}: MultiStepFormProps<T>) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = async () => {
    // Validate current step before moving to next step
    const isValid = await triggerValidation();
    console.log("?inside nextStep: => ", { isValid });
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Scroll to top when moving to the next step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Scroll to top when moving to the previous step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    // Validate all fields before submitting
    const isValid = await triggerValidation();
    if (isValid) {
      // Scroll to top before submitting
      window.scrollTo({ top: 0, behavior: "smooth" });
      onSubmit(getFormData());
    }
  };

  // Determine if this is the last step that should show submit button
  // For non-enterprise users, the last step is the basic info step (index 0)
  // For enterprise users, the last step is the final analytics step
  const isLastStep = currentStep === steps.length - 1;
  const shouldShowSubmitButton = isEnterprise ? isLastStep : currentStep === 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-fg">{steps[currentStep].title}</h2>
          <div className="text-sm text-fg-muted">
            گام {currentStep + 1} از {steps.length}
          </div>
        </div>

        <div className="mt-4 w-full bg-surface-sunken rounded-full h-2.5">
          <div
            className="bg-brand h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-md">{steps[currentStep].component}</div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`py-2 px-6 rounded-lg ${
            currentStep === 0
              ? "bg-line text-fg-muted cursor-not-allowed"
              : "bg-surface-hover text-fg hover:bg-surface-sunken"
          }`}
        >
          قبلی
        </button>

        {shouldShowSubmitButton ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="py-2 px-6 bg-brand text-on-brand rounded-lg hover:bg-brand-hover disabled:bg-blue-300"
          >
            {isSubmitting ? "در حال ارسال..." : "تکمیل ثبت"}
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="py-2 px-6 bg-brand text-on-brand rounded-lg hover:bg-brand-hover"
          >
            بعدی
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiStepForm;
