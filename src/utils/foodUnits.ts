function normalizeDisplayUnit(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d");
}

export function formatFoodUnit(unit?: string) {
  const normalized = normalizeDisplayUnit(unit);
  if (!normalized) return "g";
  if (["kg", "g", "ml", "l"].includes(normalized)) return normalized;
  if (["qua", "trai", "fruit"].includes(normalized)) return "quả";
  if (["cai", "item", "piece", "pieces", "count"].includes(normalized)) return "cái";
  if (["serving", "portion", "phan"].includes(normalized)) return "phần";
  return unit || "g";
}

export function formatFoodQuantity(quantity?: number | string) {
  const value = Number(quantity) || 0;
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 10) / 10);
}

export function formatFoodAmount(quantity?: number | string, unit?: string) {
  return `${formatFoodQuantity(quantity)} ${formatFoodUnit(unit)}`;
}
