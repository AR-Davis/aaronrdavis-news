// Cloudflare Pages Function — Post top AP story to Bluesky
// Trigger: POST /api/post-to-bluesky (manually or via cron)
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

    try {
        // 1. Fetch top AP story from our own API
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

        const story = feedData.items[0];
        const text = `${story.title}\n\n${story.link}`;

        // 2. Authenticate with Bluesky
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

        // 3. Create post (skeet)
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
            posted: story.title,
            link: story.link
        }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
