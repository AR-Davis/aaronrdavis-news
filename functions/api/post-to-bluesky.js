// Cloudflare Pages Function — Post an AP story to Bluesky with rich link cards
// Trigger: POST /api/post-to-bluesky
// Body: {"storyUrl":"https://...","storyTitle":"Headline"}
// Requires secrets: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD

// Helper: Fetch OG tags from target URL
async function fetchOgTags(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' }
    });
    const html = await res.text();

    const getMeta = (prop) => {
      const r = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
      const m = html.match(r);
      return m ? m[1] : '';
    };

    let title = getMeta('og:title');
    if (!title) {
      const t = html.match(/<title>([^<]*)<\/title>/i);
      title = t ? t[1].trim() : '';
    }

    let desc = getMeta('og:description');
    if (!desc) {
      const d = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      desc = d ? d[1] : '';
    }

    return {
      title: title.slice(0, 300),
      description: desc.slice(0, 300),
      image: getMeta('og:image')
    };
  } catch (e) {
    console.error('OG fetch failed:', e);
    return { title: '', description: '', image: '' };
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const handle = env.BLUESKY_HANDLE;
  const appPassword = env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    return new Response(JSON.stringify({
      error: 'Bluesky credentials not configured. Set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD via wrangler pages secret.'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { storyUrl, storyTitle } = body;

    if (!storyUrl) {
      return new Response(JSON.stringify({ error: 'Missing storyUrl' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch OG data for rich card
    const og = await fetchOgTags(storyUrl);
    const displayTitle = storyTitle || og.title || 'News story';

    // Build post text with URL (calculate byte positions for facets)
    const text = `${displayTitle}\n\n${storyUrl}`;
    const encoder = new TextEncoder();
    const titlePrefix = `${displayTitle}\n\n`;
    const urlStart = encoder.encode(titlePrefix).length;
    const urlEnd = urlStart + encoder.encode(storyUrl).length;

    // Authenticate with Bluesky
    const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: handle,
        password: appPassword
      })
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      throw new Error(`Bluesky auth failed: ${err}`);
    }

    const session = await sessionRes.json();

    // Build post with facets (clickable link) + embed (rich card)
    const postRecord = {
      $type: 'app.bsky.feed.post',
      text: text,
      createdAt: new Date().toISOString(),
      facets: [{
        index: { byteStart: urlStart, byteEnd: urlEnd },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: storyUrl }]
      }],
      embed: {
        $type: 'app.bsky.embed.external',
        external: {
          uri: storyUrl,
          title: displayTitle.slice(0, 300),
          description: og.description.slice(0, 300)
        }
      }
    };

    // Post to Bluesky
    const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessJwt}`
      },
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record: postRecord
      })
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      throw new Error(`Bluesky post failed: ${err}`);
    }

    const postData = await postRes.json();

    return new Response(JSON.stringify({
      success: true,
      uri: postData.uri,
      posted: displayTitle,
      link: storyUrl,
      hasCard: true,
      ogTitle: og.title,
      ogDescription: og.description
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Post error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
