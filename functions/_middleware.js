// Security headers middleware for aaronrdavis.news
// This runs on every request and adds security headers to all responses

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

export async function onRequest(context) {
  const response = await context.next();
  
  // Add security headers to all responses
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders)) {
    // Don't duplicate HSTS if Cloudflare edge already adds it
    if (key === 'Strict-Transport-Security' && newHeaders.has(key)) {
      continue;
    }
    newHeaders.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
