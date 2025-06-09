"use client";

import React from "react";
import { useController, UseControllerProps, FieldValues } from "react-hook-form";

interface InputProps<T extends FieldValues> extends UseControllerProps<T> {
  label?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}

// TODO : this input components should be deleted after completly replaced with new one
const Input = <T extends FieldValues>({
  label,
  placeholder,
  type = "text",
  className = "",
  ...controllerProps
}: InputProps<T>) => {
  const { field, fieldState } = useController(controllerProps);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={field.name}
        {...field}
        type={type}
        placeholder={placeholder}
        className={`text-gray-600 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 ${fieldState.error ? "border-red-500" : "border-gray-300"
          }`}
      />
      {fieldState.error && (
        <span className="text-red-500 text-xs">{fieldState.error.message}</span>
      )}
    </div>
  );
};

export default Input;
