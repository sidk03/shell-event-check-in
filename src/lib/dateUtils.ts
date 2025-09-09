/**
 * Get today's date in EST/EDT timezone
 * Returns date string in YYYY-MM-DD format
 */
export function getTodayInEST(): string {
  const now = new Date()
  
  // Convert to EST/EDT - this handles daylight saving automatically
  const estDateString = now.toLocaleString("en-US", { 
    timeZone: "America/New_York",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  // Parse the MM/DD/YYYY format from toLocaleString
  const [month, day, year] = estDateString.split('/')
  
  // Return in YYYY-MM-DD format for database
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Convert a UTC date to EST display format
 * Used for displaying dates from the database
 */
export function formatDateInEST(dateString: string): string {
  // Add time component to ensure correct date parsing
  const date = new Date(dateString + 'T00:00:00-05:00') // EST offset
  
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}