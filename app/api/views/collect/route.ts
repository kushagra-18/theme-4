export const runtime = 'edge';

const COLLECTOR_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api/v1/views/collect'
    : 'https://api.blazeblog.co/api/v1/views/collect';

async function forward(req: Request) {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  const body = (method === 'GET' || method === 'HEAD') ? undefined : await req.arrayBuffer();

  const fwdHeaders = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) fwdHeaders.set('content-type', ct);
  fwdHeaders.set('x-origin-host', req.headers.get('host') || '');
  fwdHeaders.set('x-forwarded-for', req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '');

  const res = await fetch(COLLECTOR_URL + url.search, {
    method,
    headers: fwdHeaders,
    body
  });

  const h = new Headers(res.headers);
  h.delete('set-cookie');
  h.set('cache-control', 'no-store');

  return new Response(res.body, { status: res.status, headers: h });
}

export async function OPTIONS() {
  const h = new Headers();
  h.set('access-control-allow-origin', '*');
  h.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  h.set('access-control-allow-headers', '*');
  return new Response(null, { status: 204, headers: h });
}

export async function POST(req: Request) { return forward(req); }
export async function GET(req: Request)  { return forward(req); }
