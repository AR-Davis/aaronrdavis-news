// Cloudflare Pages Function — Post an AP story to Bluesky
// Trigger: POST /api/post-to-bluesky (manually or via cron)
// Body (optional): {"storyUrl":"https://apnews.com/article/...","storyTitle":"Headline"}
// If body omitted, fetches top story from feed.
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
            error: 'Bluesky credentials not configured. Set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD via wrangler pages secret.'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    let storyUrl = '';
    let storyTitle = '';

    try {
        // Try to read optional body
        const body = await request.json().catch(() => ({}));
        storyUrl = body.storyUrl || '';
        storyTitle = body.storyTitle || '';
    } catch {
        storyUrl = '';
        storyTitle = '';
    }

    try {
        if (!storyUrl || !storyTitle) {
            // No specific story passed — fetch top story from feed
            const apiUrl = new URL(request.url);
            apiUrl.pathname = '/api/rss';
            apiUrl.searchParams.set('feed', 'apf-topnews');
            const feedRes = await fetch(apiUrl.toString());
            const feedData = await feedRes.json();

            if (!feedData.items || feedData.items.length === 0) {
                return new Response(JSON.stringify({ error: 'No AP stories available' }), {
                    status: 500, headers: { 'Content-Type': 'application/json' }
                });
            }

            storyTitle = feedData.items[0].title;
            storyUrl = feedData.items[0].link;
        }

        const text = `${storyTitle}\n\n${storyUrl}`;

        // 1. Authenticate with Bluesky
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

        // 2. Create post (skeet)
        const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessJwt}`
            },
            body: JSON.stringify({
                repo: session.did,
                collection: 'app.bsky.feed.post',
                record: {
                    $type: 'app.bsky.feed.post',
                    text: text,
                    createdAt: new Date().toISOString()
                }
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
            posted: storyTitle,
            link: storyUrl
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
