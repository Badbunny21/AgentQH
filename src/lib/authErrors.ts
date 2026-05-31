export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Your email is not confirmed yet. In Supabase, turn off "Confirm email" or confirm your user manually, then try Sign in again.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Wrong email or password — or your account is not confirmed yet. Try Sign in (not Create account).';
  }
  if (lower.includes('user already registered')) {
    return 'This email is already registered. Switch to Sign in below.';
  }
  if (lower.includes('signups not allowed') || lower.includes('signups are disabled')) {
    return 'Sign-ups are disabled in Supabase. Enable "Allow new users to sign up" in your project settings.';
  }

  return message;
}
