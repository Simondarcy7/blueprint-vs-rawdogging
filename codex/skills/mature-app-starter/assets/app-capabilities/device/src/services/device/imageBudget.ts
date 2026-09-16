export function validateImageBudget(image: { bytes?: number; width: number; height: number }, limits: { maxBytes: number; maxDimension: number; maxPixels: number }): 'unknown-size' | 'too-large' | 'invalid-dimensions' | 'too-many-pixels' | null {
  if (!Object.values(limits).every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Invalid image limits');
  if (!Number.isSafeInteger(image.bytes) || (image.bytes ?? 0) <= 0) return 'unknown-size';
  if (image.bytes! > limits.maxBytes) return 'too-large';
  if (![image.width, image.height].every(value => Number.isSafeInteger(value) && value > 0)) return 'invalid-dimensions';
  if (image.width > limits.maxDimension || image.height > limits.maxDimension || image.width > limits.maxPixels / image.height) return 'too-many-pixels';
  return null;
}
