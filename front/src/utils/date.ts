export const formatDateTimeRange = (start: Date, end: Date): string => {
  const startDate = start.toLocaleDateString('fa-IR');
  const startTime = start.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const endDate = end.toLocaleDateString('fa-IR');
  const endTime = end.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  if (startDate === endDate) {
    return `${startDate} - ${startTime} تا ${endTime}`;
  }

  return `${startDate} ${startTime} تا ${endDate} ${endTime}`;
};
