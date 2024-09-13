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
    }
};

export default nextConfig;
