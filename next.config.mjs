/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Inlines critical CSS using Critters to reduce render-blocking
        optimizeCss: true,
    },
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
