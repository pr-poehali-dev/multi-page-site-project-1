export const ADMIN_API_KEY = 'h99NJWtXVBQ59CqsSyxnIOZI-KwMC1ZpwzohKcM-WkA';

export const adminHeaders = (extra?: Record<string, string>): Record<string, string> => ({
  'Content-Type': 'application/json',
  'X-Api-Key': ADMIN_API_KEY,
  ...extra,
});
