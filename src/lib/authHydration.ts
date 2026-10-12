/** Sequence profile loads so an old login cannot overwrite a newer login/sign-out. */
export function createAuthHydrator<S extends { user: { id: string } }, P>(
  fetchProfile: (id: string) => Promise<P | null>,
  publish: (state: { session: S | null; profile: P | null; isLoading: boolean; profileError: boolean }) => void,
) {
  let revision = 0;
  return {
    async load(session: S | null) {
      const request = ++revision;
      publish({ session, profile: null, isLoading: !!session, profileError: false });
      if (!session) return;
      let profile: P | null = null;
      try { profile = await fetchProfile(session.user.id); } catch { /* retry shown by navigator */ }
      if (request !== revision) return;
      publish({ session, profile, isLoading: false, profileError: !profile });
    },
    invalidate() { revision++; },
  };
}

export function showProUpsell(plan?: string | null): boolean {
  return plan === 'free';
}
