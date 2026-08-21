import { getProfile } from "./store";

/**
 * Who is allowed to see the numbers.
 *
 * Keyed on the X user id, not the handle: handles get renamed, ids do not, and
 * an admin check that can be inherited by renaming an account is not a check.
 *
 * Fails closed. With ADMIN_X_IDS unset nobody is an admin, including you, which
 * is the correct default for a page that lists wallet addresses.
 */
export function adminIds(): string[] {
  return (process.env.ADMIN_X_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function isAdmin(profileId: string | null): Promise<boolean> {
  if (!profileId) return false;

  const ids = adminIds();
  if (ids.length === 0) return false;

  const profile = await getProfile(profileId);
  return !!profile && ids.includes(profile.x_user_id);
}
