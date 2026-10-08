/** Human-readable file size, e.g. 1536 → "1.5 KB". */
export const formatFileSize = (bytes: number): string => {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};
