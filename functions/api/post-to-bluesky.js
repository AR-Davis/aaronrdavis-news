// Cloudflare Pages Function — Post an AP story to Bluesky with rich link cards and images
// Trigger: POST /api/post-to-bluesky
// Body: {"storyUrl":"https://...","storyTitle":"Headline"}
// Requires secrets: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD

// Helper: Upload image blob to Bluesky
async function uploadImageBlob(accessJwt, imageUrl) {
  if (!imageUrl) return null;
  
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!imgRes.ok) {
      console.log(`Image fetch failed: ${imgRes.status} for ${imageUrl}`);
      return null;
    }
    
    const blob = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    
    const uploadRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessJwt}`,
        'Content-Type': contentType
      },
      body: new Uint8Array(blob)
    });
    
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.log(`Blob upload failed: ${err}`);
      return null;
    }
    
    return (await uploadRes.json()).blob;
    
  } catch (e) {
    console.log('Image upload error:', e.message);
    return null;
  }
}

// Helper: Fetch AP image from article HTML
async function fetchApImage(url) {
  try {
    if (!url.includes('apnews.com')) return null;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!res.ok) return null;
    
    const html = await res.text();
    
    // AP-specific patterns
    const apPatterns = [
      /"imageUrl":\s*"([^"]+)"/i,
      /"image_url":\s*"([^"]+)"/i,
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      /<img[^>]+class="[^"]*Image[^"]*"[^>]+src="([^"]+)"/i,
      /<img[^>]+data-src="([^"]+)"/i
    ];
    
    for (const pattern of apPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
        else if (imageUrl.startsWith('/')) imageUrl = 'https://apnews.com' + imageUrl;
        return imageUrl;
      }
    }
    
    return null;
  } catch (e) {
    console.log('AP image fetch error:', e.message);
    return null;
  }
}

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
    
    // Try AP-specific image fetch first
    const apImage = await fetchApImage(storyUrl);
    const imageToFetch = apImage || og.image;
    
    // Authenticate with Bluesky first (need accessJwt for image upload)
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
    
    // Upload image if available
    const thumb = imageToFetch ? await uploadImageBlob(session.accessJwt, imageToFetch) : null;

    // Build post text with URL (calculate byte positions for facets)
    const text = `${displayTitle}\n\n${storyUrl}`;
    const encoder = new TextEncoder();
    const titlePrefix = `${displayTitle}\n\n`;
    const urlStart = encoder.encode(titlePrefix).length;
    const urlEnd = urlStart + encoder.encode(storyUrl).length;

    // Build external embed
    const external = {
      uri: storyUrl,
      title: displayTitle.slice(0, 300),
      description: og.description.slice(0, 300)
    };
    
    // Add thumb if upload succeeded
    if (thumb) {
      external.thumb = thumb;
    }

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
        external: external
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
      hasImage: !!thumb,
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
