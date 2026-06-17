export function fullName(person = {}) {
  return person.full_name || person.fullName || `${person.last_name || person.lastName || ""} ${person.first_name || person.firstName || ""}`.trim() || "—";
}
export function nationalId(person = {}) {
  return person.national_id || person.cin || person.CIN || person.identity_number || "—";
}
export function phone(person = {}) {
  return person.phone || person.telephone || person.contact_phone || "—";
}
export function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR");
}
export function number(value) {
  return Number(value || 0).toLocaleString("fr-FR");
}
