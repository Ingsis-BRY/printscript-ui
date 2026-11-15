import {PaginatedUsers, User} from "./users.ts";

/**
 * Temporary identity until Auth0 is integrated: the backend reads the caller from the
 * X-User-Id header, and these are the users that can be picked in the navbar.
 * Once Auth0 is in place the id comes from the token and this file goes away.
 */
export const DEV_USERS: User[] = [
  {id: "chona", name: "Chona"},
  {id: "fede", name: "Fede"},
  {id: "mateo", name: "Mateo"},
  {id: "tomi", name: "Tomi"},
  {id: "berrets", name: "Berrets"},
]

const STORAGE_KEY = "printscript.devUserId"
const DEFAULT_USER_ID = import.meta.env.VITE_DEV_USER_ID || DEV_USERS[0].id

export const getCurrentUserId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_USER_ID
  } catch {
    return DEFAULT_USER_ID
  }
}

export const setCurrentUserId = (userId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, userId)
  } catch {
    // Storage unavailable (private mode): the default user is used.
  }
}

/** Users the current user can share with, filtered by name. Replaced by the Auth0 user search later. */
export const findOtherUsers = (name: string = "", page: number = 1, pageSize: number = 10): PaginatedUsers => {
  const currentUserId = getCurrentUserId()
  const matches = DEV_USERS.filter(user =>
      user.id !== currentUserId && user.name.toLowerCase().includes(name.toLowerCase())
  )
  return {page, page_size: pageSize, count: matches.length, users: matches}
}
