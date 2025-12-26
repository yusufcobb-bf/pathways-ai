/**
 * Join Code Utilities (Stage 21)
 *
 * Generates and normalizes classroom join codes.
 */

/**
 * Generate a readable 6-character join code.
 * Uses uppercase letters and digits, excludes confusing chars (0, O, I, L, 1).
 */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Normalize join code input for lookup.
 * - Trims whitespace
 * - Converts to uppercase
 * - Removes internal spaces
 */
export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
