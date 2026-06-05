// Cloudflare Pages Function — Post a thread to Bluesky with image support and alt text
// Trigger: POST /api/post-thread
// Body: {"posts": [{"text":"...", "url":"...", "image":"...", "alt":"...", "images":[{...}]}, ...]}
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
    
    // Upload to Bluesky
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
    
    const uploadData = await uploadRes.json();
    return uploadData.blob;
    
  } catch (e) {
    console.log('Image upload error:', e.message);
    return null;
  }
}

// Helper: Fetch OG tags from URL
async function fetchOgTags(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await res.text();
    
    const getMeta = (prop) => {
      const r = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
      const m = html.match(r);
      return m ? m[1] : '';
    };
    
    let title = getMeta('og:title');
    if (!title) {
      const t = html.match(/<title>([^<]*)</title>/i);
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
    console.log('OG fetch failed:', e.message);
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
      const explicitImage = posts[i].image; // Optional explicit image URL
      const imageAlt = posts[i].alt || posts[i].imageAlt || ''; // Alt text for images
      const multiImages = posts[i].images; // Array of {url, alt} for multiple images
      
      // Build facets and embed
      let facets = [];
      let embed = null;
      
      // Check for URLs in text and create facets
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

      // Handle multiple images (native image embed with alt text)
      if (multiImages && multiImages.length > 0) {
        const imageUploads = [];
        
        for (const img of multiImages) {
          const blob = await uploadImageBlob(accessJwt, img.url);
          if (blob) {
            imageUploads.push({
              blob: blob,
              alt: img.alt || ''
            });
          }
        }
        
        if (imageUploads.length > 0) {
          embed = {
            $type: 'app.bsky.embed.images',
            images: imageUploads.map(img => ({
              image: img.blob,
              alt: img.alt
            }))
          };
        }
      }
      // Handle single image (backward compatibility or link card thumbnail)
      else if (explicitImage && !hasUrl) {
        // Native image embed with alt text (no link card)
        const blob = await uploadImageBlob(accessJwt, explicitImage);
        if (blob) {
          embed = {
            $type: 'app.bsky.embed.images',
            images: [{
              image: blob,
              alt: imageAlt
            }]
          };
        }
      }
      // If explicit URL provided, fetch OG and create external embed with image
      else if (hasUrl) {
        try {
          const og = await fetchOgTags(hasUrl);
          const displayTitle = posts[i].title || og.title || hasUrl;
          
          // Upload image if available (explicit or from OG)
          const imageToUpload = explicitImage || og.image;
          const thumb = imageToUpload ? await uploadImageBlob(accessJwt, imageToUpload) : null;
          
          const external = {
            uri: hasUrl,
            title: displayTitle.slice(0, 300),
            description: og.description.slice(0, 300)
          };
          
          // Add thumb blob if upload succeeded
          if (thumb) {
            external.thumb = thumb;
          }
          
          embed = {
            $type: 'app.bsky.embed.external',
            external: external
          };
          
        } catch (e) {
          console.log('Embed creation failed:', e.message);
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
