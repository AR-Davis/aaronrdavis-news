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
        hourly: {},
        countries: {},
        referrers: {},
        totalVisits: 0
    };
    
    try {
        // Get daily totals for last N days
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const count = parseInt(await env.ANALYTICS_KV.get(`visits:${site}:${dayStr}`) || '0');
            stats.daily.push({ date: dayStr, visits: count });
            stats.totalVisits += count;
        }
        
        // Get page stats (list all keys starting with page:{site}:)
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
        
        // Get country data for the last N days
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const countryKeys = await env.ANALYTICS_KV.list({ prefix: `country:${site}:${dayStr}:` });
            for (const key of countryKeys.keys || []) {
                const country = key.name.replace(`country:${site}:${dayStr}:`, '');
                const count = parseInt(await env.ANALYTICS_KV.get(key.name) || '0');
                stats.countries[country] = (stats.countries[country] || 0) + count;
            }
        }
        
        // Get referrer data for the last N days
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const refKeys = await env.ANALYTICS_KV.list({ prefix: `ref:${site}:${dayStr}:` });
            for (const key of refKeys.keys || []) {
                const ref = key.name.replace(`ref:${site}:${dayStr}:`, '');
                const count = parseInt(await env.ANALYTICS_KV.get(key.name) || '0');
                stats.referrers[ref] = (stats.referrers[ref] || 0) + count;
            }
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
