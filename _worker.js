// Worker-level gate for aaronrdavis.news
// - Optional basic-auth login (disabled by default)
// - Country/IP blocks
// - Per-IP sliding-window rate limiting (isolate-local, no KV cost)

function parseBlockedSet(value) {
  return new Set((value || '').split(',').map(s => s.trim()).filter(Boolean));
}

// Isolate-local request window. Not perfect across isolates, but catches repeated abuse
// from a single IP within one isolate without extra cost.
const requestLog = new Map();
const LIMITS = {
  api: { windowMs: 60_000, max: 20 },      // /api/*
  gis: { windowMs: 60_000, max: 20 },      // /GIS_eelgrass_map/*
  default: { windowMs: 60_000, max: 60 }   // everything else
};

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
}

function getCountry(request) {
  return request.cf?.country || request.headers.get('CF-IPCountry') || '';
}

function isBlocked(request, env) {
  const blockedCountries = parseBlockedSet(env.BLOCKED_COUNTRIES || env.BLOCKED_COUNTRY_LIST);
  const blockedIps = parseBlockedSet(env.BLOCKED_IPS || env.BLOCKED_IP_LIST);
  const country = getCountry(request);
  if (country && blockedCountries.has(country)) return `country:${country}`;
  const ip = getClientIP(request);
  if (ip && blockedIps.has(ip)) return `ip:${ip}`;
  return null;
}

function getRateLimit(path) {
  if (path.startsWith('/api/')) return LIMITS.api;
  if (path.startsWith('/GIS_eelgrass_map/')) return LIMITS.gis;
  return LIMITS.default;
}

function checkRateLimit(request) {
  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;
  const limit = getRateLimit(path);
  const now = Date.now();
  const key = `${ip}:${path.split('/')[1] || 'root'}`;
  let times = requestLog.get(key) || [];
  times = times.filter(t => now - t < limit.windowMs);
  if (times.length >= limit.max) {
    return { allowed: false, retryAfter: Math.ceil((times[0] + limit.windowMs - now) / 1000) };
  }
  times.push(now);
  requestLog.set(key, times);
  return { allowed: true };
}

export default {
  async fetch(request, env, ctx) {
    // 1. Optional basic-auth login (disabled by default)
    if (env.LOGIN_REQUIRED === '1') {
      const auth = request.headers.get('Authorization');
      if (!auth || !checkBasicAuth(auth, env.AUTH_USER, env.AUTH_PASS)) {
        return new Response('Login required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="aaronrdavis.news"' }
        });
      }
    }

    // 2. Country / IP blocks
    const blockedReason = isBlocked(request, env);
    if (blockedReason) {
      return new Response('Access denied', {
        status: 403,
        headers: { 'Content-Type': 'text/plain', 'X-Block-Reason': blockedReason }
      });
    }

    // 3. Best-effort rate limiting
    const rate = checkRateLimit(request);
    if (!rate.allowed) {
      return new Response('Too many requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': String(rate.retryAfter)
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};

function checkBasicAuth(authHeader, expectedUser, expectedPass) {
  if (!expectedUser || !expectedPass) return false;
  const base64 = authHeader.replace(/^Basic\s+/i, '');
  const decoded = atob(base64);
  const [user, pass] = decoded.split(':');
  return user === expectedUser && pass === expectedPass;
}
