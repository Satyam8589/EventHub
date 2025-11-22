/**
 * Timezone Utility Functions
 * Handles conversion between UTC and IST (Indian Standard Time)
 * IST is UTC+5:30
 */

/**
 * Convert IST date/time to UTC ISO string
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {string|null} - UTC ISO string or null if invalid input
 */
export function convertISTtoUTC(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  
  // Parse the date and time strings
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a date object representing IST time
  // Note: JavaScript Date months are 0-indexed
  const istDate = new Date(year, month - 1, day, hours, minutes, 0);
  
  // IST is UTC+5:30, so subtract 5 hours and 30 minutes to get UTC
  const utcDate = new Date(istDate.getTime() - (5 * 60 + 30) * 60 * 1000);
  
  return utcDate.toISOString();
}

/**
 * Convert UTC ISO string to IST Date object
 * @param {string} utcISOString - UTC ISO string
 * @returns {Date|null} - Date object in IST or null if invalid input
 */
export function convertUTCtoIST(utcISOString) {
  if (!utcISOString) return null;
  
  // Parse the UTC ISO string
  const utcDate = new Date(utcISOString);
  
  // IST is UTC+5:30, so add 5 hours and 30 minutes
  const istDate = new Date(utcDate.getTime() + (5 * 60 + 30) * 60 * 1000);
  
  return istDate;
}

/**
 * Convert UTC ISO string to IST and return formatted date/time strings
 * @param {string} utcISOString - UTC ISO string
 * @returns {object} - Object with date and time strings in IST
 */
export function convertUTCtoISTStrings(utcISOString) {
  if (!utcISOString) return { date: null, time: null };
  
  const istDate = convertUTCtoIST(utcISOString);
  if (!istDate) return { date: null, time: null };
  
  // Format date as YYYY-MM-DD
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  
  // Format time as HH:MM
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  
  return { date, time, istDate };
}

/**
 * Get current time in IST
 * @returns {Date} - Current date/time in IST
 */
export function getCurrentIST() {
  const now = new Date();
  return new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
}

/**
 * Format IST date for display
 * @param {Date|string} date - Date object or ISO string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export function formatISTDate(date, options = {}) {
  const istDate = typeof date === 'string' ? convertUTCtoIST(date) : date;
  if (!istDate) return '';
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return istDate.toLocaleDateString('en-IN', defaultOptions);
}

/**
 * Format IST time for display
 * @param {Date|string} date - Date object or ISO string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted time string
 */
export function formatISTTime(date, options = {}) {
  const istDate = typeof date === 'string' ? convertUTCtoIST(date) : date;
  if (!istDate) return '';
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return istDate.toLocaleTimeString('en-IN', defaultOptions);
}

/**
 * Format IST datetime for display
 * @param {Date|string} date - Date object or ISO string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted datetime string
 */
export function formatISTDateTime(date, options = {}) {
  const istDate = typeof date === 'string' ? convertUTCtoIST(date) : date;
  if (!istDate) return '';
  
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return istDate.toLocaleString('en-IN', defaultOptions);
}
