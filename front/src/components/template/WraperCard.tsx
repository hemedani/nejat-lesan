"use client";
import { ReactNode } from "react";

export const ListCard = ({ children }: { children: ReactNode }) => {
  return (
    <section>
      <div className="w-full py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {children}
        </div>
      </div>
    </section>
  );
};
