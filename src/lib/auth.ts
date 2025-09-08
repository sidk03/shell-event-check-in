import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const TOKEN_NAME = 'admin-token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export interface TokenPayload {
  adminId: string
  email: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/'
  })
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}