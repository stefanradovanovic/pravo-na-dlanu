// Current domestic register only. The treaty register and Gazette archive are
// deliberately outside the product scope; age alone does not establish repeal.
export const DOMESTIC_REGISTERS = [458, 459] as const;
export const ASSEMBLY_RULES = {
  registryId: "420235",
  levels: [458, 190, 210],
  documentType: "Пословник",
} as const;
export const CATALOG_SCOPE =
  "Constitution, domestic laws, and the National Assembly Rules of Procedure in the current PIS national and education registers (458, 459). International treaty register (206) and historical Gazette archive are excluded. Older laws retained in the current register are not excluded solely by publication year.";

export function isDomesticRegister(register: number | undefined) {
  return DOMESTIC_REGISTERS.some((id) => id === register);
}
