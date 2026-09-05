// Auth gate for aaronrdavis.news — currently disabled so the site is fully public.
// To re-enable login in the future, set these Cloudflare Pages secrets:
//   LOGIN_REQUIRED = "1"
//   AUTH_USER      = your-username
//   AUTH_PASS      = your-password
// Then uncomment the block below.

export default {
  async fetch(request, env, ctx) {
    // Login gate (disabled by default):
    // if (env.LOGIN_REQUIRED === "1") {
    //   const auth = request.headers.get("Authorization");
    //   if (!auth || !checkBasicAuth(auth, env.AUTH_USER, env.AUTH_PASS)) {
    //     return new Response("Login required", {
    //       status: 401,
    //       headers: { "WWW-Authenticate": 'Basic realm="aaronrdavis.news"' }
    //     });
    //   }
    // }

    return env.ASSETS.fetch(request);
  }
};

function checkBasicAuth(authHeader, expectedUser, expectedPass) {
  if (!expectedUser || !expectedPass) return false;
  const base64 = authHeader.replace(/^Basic\s+/i, "");
  const decoded = atob(base64);
  const [user, pass] = decoded.split(":");
  return user === expectedUser && pass === expectedPass;
}
