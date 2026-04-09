export function localDateString(timezone?: string): string {
  if (timezone) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  }
  return new Date().toISOString().split("T")[0];
}
