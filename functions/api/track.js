// Simple visit tracker using KV
// GET /api/track?page=/about.html&ref=texaselections.wiki
// Returns 1x1 transparent GIF, increments counter silently

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || 'unknown';
    const referrer = url.searchParams.get('ref') || request.headers.get('Referer') || 'direct';
    const site = url.searchParams.get('site') || 'aaronrdavis.news';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    const country = request.cf?.country || 'unknown';
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = new Date().getUTCHours();
    
    try {
        // Daily totals per site
        const dayKey = `visits:${site}:${today}`;
        await env.ANALYTICS_KV.put(dayKey, String((parseInt(await env.ANALYTICS_KV.get(dayKey) || '0') + 1)));
        
        // Page totals (all time)
        const pageKey = `page:${site}:${page}`;
        await env.ANALYTICS_KV.put(pageKey, String((parseInt(await env.ANALYTICS_KV.get(pageKey) || '0') + 1)));
        
        // Hourly distribution for today
        const hourKey = `hourly:${site}:${today}:${hour}`;
        await env.ANALYTICS_KV.put(hourKey, String((parseInt(await env.ANALYTICS_KV.get(hourKey) || '0') + 1)));
        
    } catch (e) {
        // Silently fail - don't break the page
    }
    
    // Return 1x1 transparent GIF as Uint8Array (Buffer not available in Workers)
    const gifBytes = new Uint8Array([71,73,70,56,57,97,1,0,1,0,128,0,0,255,255,255,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59]);
    return new Response(gifBytes, {
        status: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
