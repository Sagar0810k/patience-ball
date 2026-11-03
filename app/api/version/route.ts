export const dynamic = 'force-dynamic';
// Build id is inlined at build time (see next.config.mjs), so a new deploy answers with a new id.
export const GET = () => Response.json({ v: process.env.NEXT_PUBLIC_BUILD_ID }, { headers: { 'Cache-Control': 'no-store' } });
