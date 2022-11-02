import {
  CookieOptions,
  createBrowserSupabaseClient as _createBrowserSupabaseClient,
  createServerSupabaseClient as _createServerSupabaseClient,
  ensureArray,
  filterCookies,
  serializeCookie
} from '@supabase/auth-helpers-shared';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PKG_NAME, PKG_VERSION } from './constants';

// Types
export type { Session, User, SupabaseClient } from '@supabase/supabase-js';

// Methods
export { default as withApiAuth } from './utils/withApiAuth';
export { default as logger } from './utils/log';

export function createBrowserSupabaseClient<
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>(
  supabaseUrl: string,
  supabaseKey: string,
  {
    cookieOptions
  }: {
    cookieOptions?: CookieOptions;
  } = {}) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'supabaseUrl and supabaseKey are required to create a Supabase client! Find these under `Settings` > `API` in your Supabase dashboard.'
    );
  }

  return _createBrowserSupabaseClient<Database, SchemaName>({
    supabaseUrl,
    supabaseKey,
    cookieOptions
  });
}

export function createServerSupabaseClient<
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database
>(
  supabaseUrl: string,
  supabaseKey: string,
  context: { req: VercelRequest; res: VercelResponse },
  {
    cookieOptions
  }: {
    cookieOptions?: CookieOptions;
  } = {}) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'supabaseUrl and supabaseKey are required to create a Supabase client! Find these under `Settings` > `API` in your Supabase dashboard.'
    );
  }

  return _createServerSupabaseClient<Database, SchemaName>({
    supabaseUrl,
    supabaseKey,
    getRequestHeader: (key) => context.req.headers[key],

    getCookie(name) {
      return context.req.cookies[name];
    },
    setCookie(name, value, options) {
      const newSetCookies = filterCookies(
        ensureArray(context.res.getHeader('set-cookie')?.toString() ?? []),
        name
      );
      const newSessionStr = serializeCookie(name, value, {
        ...options,
        // Allow supabase-js on the client to read the cookie as well
        httpOnly: false
      });

      context.res.setHeader('set-cookie', [...newSetCookies, newSessionStr]);
    },
    options: {
      global: {
        headers: {
          'X-Client-Info': `${PKG_NAME}@${PKG_VERSION}`
        }
      }
    },
    cookieOptions
  });
}
