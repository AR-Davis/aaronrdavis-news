// Cloudflare Pages Function — Sentiment Analysis
// POST /api/sentiment with {"text": "..."} or {"url": "https://..."}
// Returns: {"positive": 0.62, "negative": 0.23, "neutral": 0.15, "label": "positive"}
//
// Uses Cloudflare Workers AI: @cf/huggingface/distilbert-sst-2-int8
// Free, edge-deployed, no API key needed beyond CF account.

export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        let text = body.text || '';
        
        // If a URL is provided, fetch the article text
        if (body.url && !text) {
            try {
                const res = await fetch(body.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TexasElectionsWiki/1.0)' },
                    signal: AbortSignal.timeout(10000)
                });
                if (res.ok) {
                    const html = await res.text();
                    // Extract text from HTML — strip tags, scripts, styles
                    text = html
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
                        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    // Limit to first 2000 chars — enough for sentiment, keeps it fast
                    text = text.substring(0, 2000);
                }
            } catch (err) {
                return new Response(JSON.stringify({ 
                    error: `Failed to fetch URL: ${err.message}`,
                    url: body.url
                }), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (!text || text.length < 10) {
            return new Response(JSON.stringify({ 
                error: 'No text provided or text too short',
                textLength: text.length
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Run sentiment classification via Workers AI
        // DistilBERT SST-2: returns POSITIVE / NEGATIVE labels with scores
        const result = await env.AI.run('@cf/huggingface/distilbert-sst-2-int8', {
            text: text
        });

        // Parse result — CF returns { response: [{ label: 'POSITIVE', score: 0.99 }, ...] }
        let positive = 0, negative = 0;
        if (result && result.response) {
            // Some models return an array of label/score objects
            const scores = Array.isArray(result.response) ? result.response : [result.response];
            for (const s of scores) {
                if (s.label === 'POSITIVE') positive = s.score;
                if (s.label === 'NEGATIVE') negative = s.score;
            }
        } else if (result && result.label) {
            // Some models return a single label/score
            if (result.label === 'POSITIVE') positive = result.score;
            if (result.label === 'NEGATIVE') negative = result.score;
        }

        // Normalize — DistilBERT is binary (positive/negative), no neutral
        // We derive "neutral" from low-confidence cases (both scores near 0.5)
        const neutral = Math.max(0, 1 - positive - negative);
        const label = positive > 0.6 ? 'positive' : negative > 0.6 ? 'negative' : 'neutral';

        return new Response(JSON.stringify({
            positive: parseFloat(positive.toFixed(3)),
            negative: parseFloat(negative.toFixed(3)),
            neutral: parseFloat(neutral.toFixed(3)),
            label,
            textLength: text.length,
            model: '@cf/huggingface/distilbert-sst-2-int8',
            analyzedAt: new Date().toISOString()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ 
            error: err.message,
            stack: err.stack?.split('\n')[0]
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}