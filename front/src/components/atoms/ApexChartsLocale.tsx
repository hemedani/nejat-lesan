"use client";

const faLocale = {
  name: "fa",
  options: {
    toolbar: {
      exportToSVG: "دانلود SVG",
      exportToPNG: "دانلود PNG",
      exportToCSV: "دانلود CSV",
      menu: "منو",
      selection: "انتخاب",
      selectionZoom: "بزرگنمایی انتخاب",
      zoomIn: "بزرگنمایی",
      zoomOut: "کوچکنمایی",
      pan: "حرکت",
      reset: "بازنشانی",
    },
  },
};

if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.Apex = {
    ...((w.Apex as Record<string, unknown>) || {}),
    chart: {
      ...(((w.Apex as Record<string, unknown>)?.chart as Record<string, unknown>) || {}),
      locales: [faLocale],
      defaultLocale: "fa",
    },
  };
}

export default function ApexChartsLocale() {
  return null;
}
