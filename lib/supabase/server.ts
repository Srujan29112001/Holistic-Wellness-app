/**
 * Supabase Server Client
 *
 * Server-side Supabase client with service role access
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create Supabase admin client with service role key
 * Use only in server-side code (API routes, server components)
 */
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Export as createClient for backward compatibility
export { createServerClient as createClient };

/**
 * Get authenticated user from request
 * Returns user ID or throws error if not authenticated
 */
export async function getAuthenticatedUser(authHeader?: string | null): Promise<string> {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createServerClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user.id;
}

/**
 * Verify user session and return user ID
 * For use in API routes
 */
export async function verifySession(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  return getAuthenticatedUser(authHeader);
}
