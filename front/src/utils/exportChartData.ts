const formatNumber = (val: number) =>
  val.toLocaleString("fa-IR");

export function downloadFullChartData(
  categories: string[],
  series: { name: string; data: number[] }[],
  filename = "chart-data",
) {
  const headers = ["دسته", ...series.map((s) => s.name)];
  const maxLen = Math.max(categories.length, ...series.map((s) => s.data.length));

  let csv = "\uFEFF";
  csv += headers.join(",") + "\n";

  for (let i = 0; i < maxLen; i++) {
    const row = [categories[i] || ""];
    for (const s of series) {
      row.push(s.data[i] !== undefined ? formatNumber(s.data[i]) : "");
    }
    csv += row.join(",") + "\n";
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
