/**
 * Supabase Authentication Utilities
 *
 * Provides helper functions for:
 * - User sign up/in/out
 * - Session management
 * - Protected route handling
 */

import { createClient } from "./client";
import type { Provider } from "@supabase/supabase-js";

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, metadata?: any) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithProvider(provider: Provider) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get current user session
 */
export async function getSession() {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: any) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
