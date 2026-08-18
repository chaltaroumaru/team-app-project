/**
 * CORS handling for API routes meant to be called directly from an
 * external coaching site's frontend (see /coach and README "組み込み方法").
 *
 * Set COACH_API_ALLOWED_ORIGIN to a comma-separated allowlist in
 * production (e.g. "https://your-coaching-site.com"). Defaults to "*" so
 * the MVP works out of the box, but that means any website could call
 * this endpoint and consume your Anthropic API quota — lock it down
 * before going live.
 */
export function resolveCorsOrigin(requestOrigin: string | null): string {
  const allowed = process.env.COACH_API_ALLOWED_ORIGIN?.split(",").map((s) => s.trim());
  if (!allowed || allowed.length === 0 || allowed.includes("*")) return "*";
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0];
}

export function corsHeaders(requestOrigin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(requestOrigin),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
