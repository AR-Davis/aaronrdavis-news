// Analytics dashboard - view traffic stats
// GET /api/stats?site=aaronrdavis.news&days=7

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const site = url.searchParams.get('site') || 'aaronrdavis.news';
    const days = parseInt(url.searchParams.get('days') || '7');
    
    const stats = {
        site,
        queried: new Date().toISOString(),
        daily: [],
        pages: {},
        hourly: {}
    };
    
    try {
        // Get daily totals for last N days
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const count = parseInt(await env.ANALYTICS_KV.get(`visits:${site}:${dayStr}`) || '0');
            stats.daily.push({ date: dayStr, visits: count });
        }
        
        // Get page stats (list all keys starting with page:{site}:)
        // KV list is limited, so we do a best-effort scan
        const pageKeys = await env.ANALYTICS_KV.list({ prefix: `page:${site}:` });
        for (const key of pageKeys.keys || []) {
            const pageName = key.name.replace(`page:${site}:`, '');
            stats.pages[pageName] = parseInt(await env.ANALYTICS_KV.get(key.name) || '0');
        }
        
        // Get hourly distribution for today
        const today = new Date().toISOString().split('T')[0];
        for (let h = 0; h < 24; h++) {
            const count = parseInt(await env.ANALYTICS_KV.get(`hourly:${site}:${today}:${h}`) || '0');
            if (count > 0) stats.hourly[h] = count;
        }
        
    } catch (e) {
        stats.error = e.message;
    }
    
    return new Response(JSON.stringify(stats, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
