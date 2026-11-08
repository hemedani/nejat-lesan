import React from "react";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "start";
  /** A full `tint-*` utility, passed literally — Tailwind cannot see an interpolated class. */
  tint?: string;
  className?: string;
}

/**
 * One heading shape for every landing section, so the page reads as one
 * document rather than five separately styled pages.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tint = "tint-brand",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={`${centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"} ${className}`}
    >
      <span
        className={`${tint} inline-flex items-center gap-2 rounded-full border border-tint-border bg-tint-soft px-3.5 py-1.5 text-xs font-medium text-tint-fg`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {eyebrow}
      </span>

      <h2 className="mt-5 text-3xl font-bold leading-tight text-fg md:text-4xl">{title}</h2>

      {description ? (
        <p className="mt-4 text-base leading-8 text-fg-muted md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
