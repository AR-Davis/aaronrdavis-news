// Cloudflare Pages Function — Post a thread to Bluesky
// Trigger: POST /api/post-thread
// Body: {"posts": [{"text":"..."}, {"text":"..."}, ...]}
// Requires secrets: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const handle = env.BLUESKY_HANDLE;
  const appPassword = env.BLUESKY_APP_PASSWORD;

  if (!handle || !appPassword) {
    return new Response(JSON.stringify({
      error: 'Bluesky credentials not configured'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const posts = body.posts || [];
    
    if (!posts.length) {
      return new Response(JSON.stringify({ error: 'No posts provided' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Authenticate
    const sessionRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: appPassword })
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      throw new Error(`Bluesky auth failed: ${err}`);
    }

    const session = await sessionRes.json();
    const accessJwt = session.accessJwt;
    const did = session.did;

    const postedUris = [];
    let lastPostUri = null;
    let lastPostCid = null;
    let rootUri = null;
    let rootCid = null;

    // Post each thread item
    for (let i = 0; i < posts.length; i++) {
      const postText = posts[i].text;
      const hasUrl = posts[i].url;
      
      // Build facets and embed
      let facets = [];
      let embed = null;
      
      // Check for URLs and create facets
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = postText.match(urlRegex);
      
      if (urls) {
        for (const url of urls) {
          const urlIndex = postText.indexOf(url);
          const encoder = new TextEncoder();
          const before = postText.slice(0, urlIndex);
          const byteStart = encoder.encode(before).length;
          const byteEnd = byteStart + encoder.encode(url).length;
          
          facets.push({
            index: { byteStart, byteEnd },
            features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }]
          });
        }
      }

      // If explicit URL provided, fetch OG and create external embed
      if (hasUrl) {
        try {
          const res = await fetch(hasUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const html = await res.text();
          const getMeta = (prop) => {
            const r = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
            const m = html.match(r);
            return m ? m[1] : '';
          };
          
          embed = {
            $type: 'app.bsky.embed.external',
            external: {
              uri: hasUrl,
              title: getMeta('og:title').slice(0, 300) || posts[i].title || hasUrl,
              description: getMeta('og:description').slice(0, 300) || ''
            }
          };
        } catch (e) {
          console.log('OG fetch failed:', e);
        }
      }

      // Build reply reference if not first post
      let reply = null;
      if (i > 0 && rootUri && rootCid && lastPostUri && lastPostCid) {
        reply = {
          root: { uri: rootUri, cid: rootCid },
          parent: { uri: lastPostUri, cid: lastPostCid }
        };
      }

      const postRecord = {
        $type: 'app.bsky.feed.post',
        text: postText,
        createdAt: new Date().toISOString(),
        ...(facets.length && { facets }),
        ...(embed && { embed }),
        ...(reply && { reply })
      };

      const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessJwt}`
        },
        body: JSON.stringify({
          repo: did,
          collection: 'app.bsky.feed.post',
          record: postRecord
        })
      });

      if (!postRes.ok) {
        const err = await postRes.text();
        throw new Error(`Post ${i + 1} failed: ${err}`);
      }

      const postData = await postRes.json();
      postedUris.push(postData.uri);
      lastPostUri = postData.uri;
      lastPostCid = postData.cid;
      
      // Set root on first post
      if (i === 0) {
        rootUri = postData.uri;
        rootCid = postData.cid;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      threadLength: postedUris.length,
      uris: postedUris,
      rootUri: rootUri
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Thread post error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
