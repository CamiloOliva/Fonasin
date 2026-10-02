export const WHATSAPP_URL =
  import.meta.env.VITE_WHATSAPP_URL ||
  'https://wa.me/573042042889?text=%C2%A1Hola%21%20Quisiera%20obtener%20m%C3%A1s%20informaci%C3%B3n'
// Keep the public configuration name aligned with the service clients.
export const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || ''
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL?.trim() || 'fonasinbucaramanga@gmail.com'

export function officialSocialUrl(value: string | undefined, allowedHosts: readonly string[]): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim())
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || !allowedHosts.some(allowed => host === allowed || host === `www.${allowed}`)) return null
    return url.toString()
  } catch {
    return null
  }
}

export const OFFICIAL_SOCIAL_URLS = {
  facebook: officialSocialUrl(import.meta.env.VITE_FACEBOOK_URL, ['facebook.com']),
  instagram: officialSocialUrl(import.meta.env.VITE_INSTAGRAM_URL, ['instagram.com']),
  youtube: officialSocialUrl(import.meta.env.VITE_YOUTUBE_URL, ['youtube.com', 'youtu.be']),
}
export const siteConfig = { shortName:'FONASIN', navName:'Fondo de Empleados del Sector Mineroenergético', name:'FONASIN - Fondo de Empleados del Sector Mineroenergético - Empleados SINTRAELECOL', provisional:true }
