import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // ✅ Limit file tracing to your project directory
        outputFileTracingRoot: path.join(process.cwd()),
    },
    outputFileTracingExcludes: {
        "*": [
            "**/Application Data/**",
            "**/AppData/**",
        ],
    },
    eslint: {
        // ✅ Avoid ESLint globbing during build
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
