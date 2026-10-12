:# Access control for aaronrdavis.news

## Current status

The site is **public**. No login is required for any page or asset.

The `_worker.js` gate also applies:
- Optional basic-auth login (disabled by default)
- Country / IP block lists via `BLOCKED_COUNTRIES` / `BLOCKED_IPS` secrets
- Two-tier rate limiting (per-isolate window + optional KV-backed global window)

## Re-enabling login in the future

The repo includes `_worker.js`, a Cloudflare Pages Function that can gate the entire site with HTTP Basic Authentication. It is currently disabled.

To turn login back on:

1. Set these Cloudflare Pages secrets for the project:
   - `LOGIN_REQUIRED` = `1`
   - `AUTH_USER` = the username you want
   - `AUTH_PASS` = the password you want

2. Leave the secrets absent and simply set `LOGIN_REQUIRED=1`, since `_worker.js` already reads them.

3. Redeploy:
   ```bash
   npm run deploy
   ```

## Alternative: Cloudflare Access

You can also restrict the site through the Cloudflare dashboard:
- Go to **Cloudflare dashboard** → Select the `aaronrdavis.news` zone → **Zero Trust** → **Access** → **Applications**.
- Create an Access application for `aaronrdavis.news` and configure an identity provider or one-time PIN.
- If you use this method, delete or disable `_worker.js` so it does not conflict.

## Security configuration

Applied by Shepherd on 2026-10-12:

| Control | Status | Notes |
|---|---|---|
| HTTPS redirect | ✅ On | HTTP 301 → HTTPS |
| `_headers` file | ✅ Updated | CSP, X-Frame, COOP, HSTS, etc. |
| `security.txt` | ✅ Added | `/.well-known/security.txt` |
| `robots.txt` | ✅ Added | Allow all |
| Rate limiting | ✅ Worker-level | 60 req/min default, 20 req/min for `/api/*` and GIS assets |
| Country/IP blocks | ✅ Worker-level | Env-driven, currently empty unless secrets set |
| `always_use_https` | ✅ On | Cloudflare zone setting — enabled in dashboard |
| `min_tls_version` | ✅ 1.2 | Cloudflare zone setting — enabled in dashboard |
| SSL mode | ✅ Full (strict) | Cloudflare zone setting — enabled in dashboard |
| Zone HSTS | ✅ Enabled | Cloudflare zone setting — enabled in dashboard (12 months, include subdomains, preload) |
| Hotlink protection | ✅ On | Cloudflare zone setting — enabled in dashboard |
| DNSSEC | ✅ Enabled | Cloudflare zone setting — enabled in dashboard |
| CAA records | ⏸️ None | Optional; add via dashboard if you want issuance restriction |
| HSTS preload submission | ⏸️ Not submitted | Submit at `https://hstspreload.org/` after 1–2 weeks of stable HSTS |

## Notes

- The worker-based gate is simple but not suitable for highly sensitive content; use Cloudflare Access for stronger controls.
- Keep credentials out of this repo. Set them as Cloudflare Pages secrets only.
