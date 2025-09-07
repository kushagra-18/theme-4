BlazeBlog Next Static Uploader

Overview
- Uploads Next.js build assets from `.next/static/**` to an S3-compatible bucket (AWS S3 or Cloudflare R2) via the S3 API.
- Preserves Next path structure under `_next/static/**` so you can serve via a CDN using `assetPrefix`.
- Sets `Cache-Control: public, max-age=31536000, immutable` and proper `Content-Type`.

Setup
1) Install deps:
   - npm install @aws-sdk/client-s3 @aws-sdk/lib-storage

2) Create a `.env.local` in this folder with your credentials (do NOT commit):

   AWS_ACCESS_KEY_ID=YOUR_KEY
   AWS_SECRET_ACCESS_KEY=YOUR_SECRET
   AWS_S3_BUCKET_NAME=blazeblog
   # For R2 (S3-compatible)
   AWS_R2_ENDPOINT=https://ce2ee8cba2f84034921cd9f646f5e148.r2.cloudflarestorage.com
   AWS_REGION=auto

   # Optional prefix within the bucket (defaults to root)
   CDN_PREFIX=

3) Build Next:
   - npm run build

4) Upload:
   - npm run upload:static

What gets uploaded
- Local: `.next/static/**`
- Remote: `${CDN_PREFIX}_next/static/**` (prefix omitted if empty)

Notes
- For Cloudflare R2, use `AWS_R2_ENDPOINT` and set `AWS_REGION=auto`.
- Ensure your CDN or static domain points to this bucket and serves with HTTP/2/3 and Brotli/Gzip.
- Consider setting `assetPrefix` in `next.config.mjs` to your CDN domain.

