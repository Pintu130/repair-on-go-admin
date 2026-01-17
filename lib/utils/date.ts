/**
 * Format date to "08 Jan 2026" format
 * @param dateString - Date string in ISO format (YYYY-MM-DD) or Date object
 * @returns Formatted date string like "08 Jan 2026"
 */
export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return ""

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return ""
    }

    // Format: "08 Jan 2026"
    const day = date.getDate().toString().padStart(2, "0")
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year}`
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}

/**
 * Format date with time to "08 Jan 2026, 10:30 AM" format
 * @param dateString - Date string in ISO format or Date object
 * @returns Formatted date string with time
 */
export function formatDateTime(dateString: string | Date | undefined | null): string {
  if (!dateString) return ""

  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return ""
    }

    const formattedDate = formatDate(date)
    if (!formattedDate) return ""

    // Format time: "10:30 AM"
    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`

    return `${formattedDate}, ${formattedTime}`
  } catch (error) {
    console.error("Error formatting date time:", error)
    return ""
  }
}
