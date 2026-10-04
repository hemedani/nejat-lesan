"use client";
import React from "react";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";

interface CommonInputProps {
  label?: string;
  className?: string;
  errMsg?: string;
  placeholder?: string;
}

/** react-hook-form mode */
interface RhfInputProps<T extends FieldValues = FieldValues> extends CommonInputProps {
  name: FieldPath<T>;
  register: UseFormRegister<T>;
  type?: string;
  step?: string;
}

/** plain controlled mode (filters & simple forms) */
interface ControlledInputProps extends CommonInputProps {
  name?: string;
  value: string | number;
  onValueChange: (value: string) => void;
  type?: string;
  step?: string;
  rows?: number;
}

export type MyInputProps<T extends FieldValues = FieldValues> =
  | RhfInputProps<T>
  | ControlledInputProps;

const controlClasses = (errMsg?: string) => `
  w-full rounded-xl border bg-white/[.04] px-3 py-2.5 text-sm text-white text-right
  outline-none placeholder:text-slate-600
  transition-colors duration-200 focus:border-blue-400/50
  ${errMsg ? "border-rose-400/50" : "border-white/10 hover:border-white/20"}
`;

function ErrorText({ errMsg }: { errMsg?: string }) {
  if (!errMsg) return null;
  return (
    <span className="mt-1 flex items-center gap-1 text-right text-xs font-medium text-rose-400">
      <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {errMsg}
    </span>
  );
}

const MyInput = <T extends FieldValues = FieldValues>(props: MyInputProps<T>) => {
  const { className, errMsg, placeholder, ...rest } = props;
  const id = rest.name || rest.label || undefined;
  const isTextarea = rest.type === "textarea";
  const controlClassName = `${controlClasses(errMsg)} ${isTextarea ? "resize-none" : ""}`;

  const rhf = "register" in rest ? rest : null;

  const commonControlProps = rhf
    ? ({ ...rhf.register(rhf.name) } as Record<string, unknown>)
    : ({
        value: (rest as ControlledInputProps).value,
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          (rest as ControlledInputProps).onValueChange(event.target.value),
      } as Record<string, unknown>);

  return (
    <div className={`flex flex-col gap-2 ${className || ""}`}>
      {rest.label && (
        <label htmlFor={id} className="text-right text-sm font-medium text-slate-300">
          {rest.label}
        </label>
      )}

      {isTextarea ? (
        <textarea
          id={id}
          placeholder={placeholder || rest.label}
          rows={(rest as ControlledInputProps).rows ?? 4}
          className={controlClassName}
          {...commonControlProps}
        />
      ) : (
        <input
          id={id}
          type={rest.type || "text"}
          step={rest.step}
          placeholder={placeholder || rest.label}
          className={controlClassName}
          {...commonControlProps}
        />
      )}

      <ErrorText errMsg={errMsg} />
    </div>
  );
};

export default MyInput;
