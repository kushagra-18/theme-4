/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Inlines critical CSS using Critters to reduce render-blocking
        optimizeCss: true,
    },
    // Load JS/CSS chunks from CDN only when explicitly enabled in production
    assetPrefix:
      process.env.NODE_ENV === 'production' &&
      String(process.env.UPLOAD_CHUNKS || '').toLowerCase() === 'true' &&
      process.env.NEXT_PUBLIC_ASSET_PREFIX
        ? process.env.NEXT_PUBLIC_ASSET_PREFIX
        : undefined,
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'static.blazeblog.co',
                port: '',
                pathname: '/blazeblog/**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
             {
                protocol: 'https',
                hostname: 'blazeblog.s3.apac.amazonaws.com',
                port: '',
                pathname: '/**',
            }
        ],
    },
};

export default nextConfig;
