/**
 * X OAuth 2.0, authorization code flow with PKCE.
 *
 * We are a confidential client: the token exchange is authenticated with the
 * client secret over HTTP Basic, and the access token never leaves the server.
 * We exchange it once, read the profile, and drop it. No refresh token is
 * requested, because we never call the API again on the user's behalf.
 */

const AUTHORIZE = "https://x.com/i/oauth2/authorize";
const TOKEN = "https://api.x.com/2/oauth2/token";
const ME = "https://api.x.com/2/users/me";

/** Exactly what /2/users/me needs and nothing more. */
export const SCOPES = ["users.read", "tweet.read"] as const;

export const STATE_COOKIE = "x_oauth_state";
export const VERIFIER_COOKIE = "x_oauth_verifier";
/** The round trip through X should take seconds, not hours. */
export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export function xConfigured(): boolean {
  return Boolean(process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET);
}

function clientId(): string {
  const v = process.env.X_CLIENT_ID;
  if (!v) throw new Error("X_CLIENT_ID is not set");
  return v;
}

function clientSecret(): string {
  const v = process.env.X_CLIENT_SECRET;
  if (!v) throw new Error("X_CLIENT_SECRET is not set");
  return v;
}

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

/** S256 challenge. Plain is allowed by the spec and is not worth using. */
export async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64url(new Uint8Array(digest));
}

/**
 * The origin X will redirect back to. It must equal a callback URL registered
 * on the X app EXACTLY, so APP_URL wins when it is set.
 *
 * Deriving it from the request host is convenient but fragile: a visitor on
 * www.example.com and one on example.com produce two different redirect_uri
 * values, and X rejects whichever is not registered. Setting APP_URL to the
 * canonical origin makes it one value regardless of how the user arrived.
 */
export function originOf(request: Request): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;

  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function redirectUri(request: Request): string {
  return `${originOf(request)}/api/auth/x/callback`;
}

export function authorizeUrl(input: {
  state: string;
  challenge: string;
  redirectUri: string;
}): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: input.redirectUri,
    scope: SCOPES.join(" "),
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORIZE}?${params.toString()}`;
}

export type XUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followers: number | null;
  following: number | null;
  createdAt: string | null;
  verified: boolean;
};

/** Swap the code for an access token. Throws with X's own error text. */
async function exchangeCode(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<string> {
  const basic = Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64");

  const res = await fetch(TOKEN, {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      code_verifier: input.verifier,
      client_id: clientId(),
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    throw new Error(
      `token exchange failed (${res.status}): ${
        json.error_description ?? json.error ?? "no access_token"
      }`,
    );
  }
  return json.access_token;
}

/** Read the signed-in user. This is the only API call we ever make. */
async function fetchMe(token: string): Promise<XUser> {
  const url = new URL(ME);
  url.searchParams.set(
    "user.fields",
    "profile_image_url,description,public_metrics,created_at,verified",
  );

  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  const json = (await res.json().catch(() => ({}))) as {
    data?: {
      id: string;
      username: string;
      name: string;
      profile_image_url?: string;
      description?: string;
      created_at?: string;
      verified?: boolean;
      public_metrics?: { followers_count?: number; following_count?: number };
    };
    title?: string;
    detail?: string;
  };

  if (!res.ok || !json.data) {
    throw new Error(
      `users/me failed (${res.status}): ${json.detail ?? json.title ?? "no data"}`,
    );
  }

  const d = json.data;
  return {
    id: d.id,
    username: d.username,
    name: d.name || d.username,
    // X hands back the 48px "_normal" crop by default. The card shows it at
    // 80px, so ask for the larger original instead.
    avatarUrl: d.profile_image_url?.replace("_normal.", "_400x400.") ?? null,
    bio: d.description || null,
    followers: d.public_metrics?.followers_count ?? null,
    following: d.public_metrics?.following_count ?? null,
    createdAt: d.created_at ?? null,
    verified: Boolean(d.verified),
  };
}

export async function completeLogin(input: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<XUser> {
  const token = await exchangeCode(input);
  return fetchMe(token);
}
