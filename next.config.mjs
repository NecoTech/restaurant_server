/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // matching all API routes
                source: "/api/:path*",
                headers: [
                    // other headers omitted for brevity...
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
                ]
            }
        ]
    },
    images: {
        domains: [
            'media1.tenor.com',
            'media.tenor.com',
            'picsum.photos',
            'res.cloudinary.com', // If you're using Cloudinary
            'images.unsplash.com', // If you're using Unsplash
            'example.com' // Add other domains as needed
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    reactStrictMode: true,
};

export default nextConfig;
