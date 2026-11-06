/** Source comparison gates editorial content; it does not establish legal validity. */
export function learningSourceChanged(
  pin: { sourceVersion: string; sourceSha256?: string },
  source: { citation: string; sha256?: string },
): boolean {
  return (
    pin.sourceVersion !== source.citation ||
    (pin.sourceSha256 !== undefined && pin.sourceSha256 !== source.sha256)
  );
}
