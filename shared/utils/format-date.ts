export function formatRequestDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
