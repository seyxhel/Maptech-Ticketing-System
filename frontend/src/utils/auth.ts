export function base64UrlDecode(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const bin = atob(str)
  try {
    return decodeURIComponent(escape(bin))
  } catch (e) {
    return bin
  }
}

export function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=localhost; SameSite=Lax`
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost; SameSite=Lax`
}

export type User = {
  id: number
  username: string
  email: string
  role: string
  phone?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  suffix?: string
}

export function parseUserFromJWT(token: string): User | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = base64UrlDecode(parts[1])
    const obj = JSON.parse(payload)
    const rawId = obj.id || obj.user_id || obj.sub || null
    const id = rawId ? Number(rawId) : null
    return { id: id!, username: obj.username, email: obj.email || '', role: obj.role }
  } catch (e) {
    return null
  }
}

export function roleRedirectPath(u: User | null) {
  if (!u) return '/login'
  if (u.role === 'client') return '/homepage'
  if (u.role === 'employee') return '/employee/dashboard'
  if (u.role === 'admin') return '/admin/dashboard'
  return '/login'
}
