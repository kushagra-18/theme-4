#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Load local env if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Config
const ROOT = path.resolve(__dirname, '..');
const NEXT_DIR = path.join(ROOT, '.next');
const SRC_DIR = path.join(NEXT_DIR, 'static');
const BUILD_ID_PATH = path.join(NEXT_DIR, 'BUILD_ID');

const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const ENDPOINT = process.env.AWS_R2_ENDPOINT || process.env.AWS_S3_ENDPOINT || undefined;
const REGION = process.env.AWS_REGION || 'auto';
const CDN_PREFIX = (process.env.CDN_PREFIX || '').replace(/^\/+|\/+$/g, '');

if (!BUCKET || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error('Missing required env: AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const client = new S3Client({
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
  ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: true } : {}),
});

const mime = (file) => {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.js': return 'application/javascript';
    case '.mjs': return 'application/javascript';
    case '.css': return 'text/css';
    case '.json': return 'application/json';
    case '.txt': return 'text/plain';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.avif': return 'image/avif';
    case '.map': return 'application/json';
    default: return 'application/octet-stream';
  }
};

const walk = (dir) => {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
};

const readBuildId = () => {
  try { return fs.readFileSync(BUILD_ID_PATH, 'utf8').trim(); } catch { return null; }
};

const prefixKey = (key) => (CDN_PREFIX ? `${CDN_PREFIX}/${key}` : key);

async function exists(Key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key }));
    return true;
  } catch {
    return false;
  }
}

async function putFile(localPath, remoteKey) {
  const Body = fs.createReadStream(localPath);
  const ContentType = mime(localPath);
  const CacheControl = 'public, max-age=31536000, immutable';
  const upload = new Upload({
    client,
    params: { Bucket: BUCKET, Key: remoteKey, Body, ContentType, CacheControl },
    queueSize: 8,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });
  await upload.done();
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('Missing .next/static. Run `npm run build` first.');
    process.exit(1);
  }

  const buildId = readBuildId();
  if (!buildId) {
    console.error('BUILD_ID not found in .next. Did the build complete?');
    process.exit(1);
  }

  const files = walk(SRC_DIR);
  console.log(`Found ${files.length} static files to upload.`);

  let uploaded = 0;
  for (const file of files) {
    const rel = path.relative(SRC_DIR, file).replace(/\\/g, '/');
    const key = prefixKey(`_next/static/${rel}`);

    // Skip if already exists (idempotent deploys)
    const already = await exists(key);
    if (already) {
      continue;
    }

    await putFile(file, key);
    uploaded++;
    if (uploaded % 10 === 0) console.log(`Uploaded ${uploaded}/${files.length}`);
  }

  console.log(`Done. Uploaded ${uploaded} new file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
// Only operate in production unless explicitly forced
if (process.env.NODE_ENV !== 'production' && process.env.FORCE_UPLOAD !== '1') {
  console.log('Skipping upload: NODE_ENV is not production. Set FORCE_UPLOAD=1 to override.');
  process.exit(0);
}

