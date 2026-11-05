// Current domestic register only. The treaty register and Gazette archive are
// deliberately outside the product scope; age alone does not establish repeal.
export const DOMESTIC_REGISTERS = [458, 459] as const;
export const CATALOG_SCOPE =
  "Constitution and domestic laws in the current PIS national and education registers (458, 459). International treaty register (206) and historical Gazette archive are excluded. Older laws retained in the current register are not excluded solely by publication year.";

export function isDomesticRegister(register: number | undefined) {
  return DOMESTIC_REGISTERS.some((id) => id === register);
}
