"use client";
import React from "react";
import { FieldPath, FieldValues, UseFormRegister } from "react-hook-form";

interface InputProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label: string
  register: UseFormRegister<T>;
  className?: string;
  errMsg?: string
  type?: string;
  placeholder?: string
}

const MyInput = <T extends FieldValues = FieldValues>({ className, errMsg, name, type, label, placeholder, register }: InputProps<T>) => {

  return (
    <div className={`w-1/2 p-4 flex flex-col gap-1 ${className ? className : ""}`}>
      <label htmlFor={name}>{label}</label>
      {type === "textarea" ? (
        <textarea
          id={name}
          {...register(name)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <input className={`text-gray-600 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 ${errMsg ? "border-red-500" : "border-gray-300"}`} {...register(name)} id={name} name={name} type={type ? type : "text"} placeholder={placeholder ? placeholder : label} />
      )}
      {errMsg && (<span className="text-red-500 text-xs">{errMsg}</span>)}
    </div>
  );
};

export default MyInput;
