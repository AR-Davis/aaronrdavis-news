// Worker-level gate for aaronrdavis.news
// - Optional basic-auth login (disabled by default)
// - Country/IP blocks via env secrets
// - Two-tier rate limiting: isolate-local window + KV-backed global window
//
// Rate limit tiers:
//   /api/*          20 req/min
//   /GIS_eelgrass_map/*  20 req/min
//   everything else 60 req/min
//
// If ANALYTICS_KV is bound, suspicious IPs that exceed the local trigger are
// checked against a global per-minute KV counter and blocked globally.

const BUCKETS = {
  api: { windowMs: 60_000, max: 20, localTrigger: 10 },
  gis: { windowMs: 60_000, max: 20, localTrigger: 10 },
  default: { windowMs: 60_000, max: 60, localTrigger: 30 },
};

// Isolate-local request window. Catches repeated abuse within one isolate.
const requestLog = new Map();

function parseBlockedSet(value) {
  return new Set((value || '').split(',').map(s => s.trim()).filter(Boolean));
}

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

function getBucket(path) {
  if (path.startsWith('/api/')) return 'api';
  if (path.startsWith('/GIS_eelgrass_map/')) return 'gis';
  return 'default';
}

function nowBucket() {
  return Math.floor(Date.now() / 60_000); // one-minute bucket
}

async function checkRateLimit(request, env) {
  const ip = getClientIP(request);
  const path = new URL(request.url).pathname;
  const bucket = getBucket(path);
  const cfg = BUCKETS[bucket];
  const now = Date.now();
  const key = `${ip}:${bucket}`;

  // 1. Update isolate-local window
  let local = requestLog.get(key) || [];
  local = local.filter(t => now - t < cfg.windowMs);
  local.push(now);
  requestLog.set(key, local);

  if (local.length >= cfg.max) {
    return { allowed: false, retryAfter: Math.ceil(cfg.windowMs / 1000), reason: 'local-window' };
  }

  // 2. If KV is bound and local count crossed the trigger, check global counter
  const kv = env.ANALYTICS_KV || env.RATE_LIMIT_KV;
  if (kv && local.length >= cfg.localTrigger) {
    const kvKey = `rl:${ip}:${nowBucket()}`;
    try {
      const stored = await kv.get(kvKey);
      let globalCount = stored ? parseInt(stored, 10) : 0;
      if (Number.isNaN(globalCount)) globalCount = 0;
      const total = globalCount + local.length;
      if (total >= cfg.max) {
        return { allowed: false, retryAfter: Math.ceil(cfg.windowMs / 1000), reason: 'global-window' };
      }
      // Write back updated global count, expire after two minutes
      await kv.put(kvKey, String(globalCount + 1), { expirationTtl: 120 });
    } catch (e) {
      // If KV fails, fall back to local window (already checked)
    }
  }

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

    // 3. Rate limiting
    const rate = await checkRateLimit(request, env);
    if (!rate.allowed) {
      return new Response('Too many requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          'Retry-After': String(rate.retryAfter),
          'X-Rate-Reason': rate.reason
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
