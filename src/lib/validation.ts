/**
 * Validates that a University ID is exactly 9 digits
 * @param uid - The University ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidUniversityId(uid: string): boolean {
  // Check if it's exactly 9 characters and all are digits
  return /^\d{9}$/.test(uid.trim())
}

/**
 * Gets a user-friendly error message for invalid University IDs
 * @param uid - The invalid University ID
 * @returns Error message string
 */
export function getUniversityIdError(uid: string): string {
  const trimmed = uid.trim()
  
  if (trimmed.length === 0) {
    return 'University ID is required'
  }
  
  if (trimmed.length !== 9) {
    return 'University ID must be exactly 9 digits'
  }
  
  if (!/^\d+$/.test(trimmed)) {
    return 'University ID can only contain numbers'
  }
  
  return 'University ID must be exactly 9 digits'
}