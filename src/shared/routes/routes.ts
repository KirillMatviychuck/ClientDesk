import { generatePath } from 'react-router'

/**
 * Route path patterns. Single source of truth for the router config (app layer)
 * and for links between pages (any layer). Never hardcode paths elsewhere.
 */
export const ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  clients: '/clients',
  clientDetails: '/clients/:id',
  deals: '/deals',
  tasks: '/tasks',
  invoices: '/invoices',
  settings: '/settings',
} as const

/** Builders for parameterized routes; params are type-checked against the pattern. */
export const buildPath = {
  clientDetails: (id: string) => generatePath(ROUTES.clientDetails, { id }),
} as const
