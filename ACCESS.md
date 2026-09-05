# Access control for aaronrdavis.news

## Current status

The site is **public**. No login is required for any page or asset.

## Re-enabling login in the future

The repo includes `_worker.js`, a Cloudflare Pages Function that can gate the entire site with HTTP Basic Authentication. It is currently disabled.

To turn login back on:

1. Set these Cloudflare Pages secrets for the project:
   - `LOGIN_REQUIRED` = `1`
   - `AUTH_USER` = the username you want
   - `AUTH_PASS` = the password you want

2. Uncomment the login block in `_worker.js` (or leave the secrets absent and simply set `LOGIN_REQUIRED=1`, since the code already reads them).

3. Redeploy:
   ```bash
   npm run deploy
   ```

## Alternative: Cloudflare Access

You can also restrict the site through the Cloudflare dashboard:
- Go to **Cloudflare dashboard** → Select the `aaronrdavis.news` zone → **Zero Trust** → **Access** → **Applications**.
- Create an Access application for `aaronrdavis.news` and configure an identity provider or one-time PIN.
- If you use this method, delete or disable `_worker.js` so it does not conflict.

## Notes

- The worker-based gate is simple but not suitable for highly sensitive content; use Cloudflare Access for stronger controls.
- Keep credentials out of this repo. Set them as Cloudflare Pages secrets only.
