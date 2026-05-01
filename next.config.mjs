/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // nsfwjs and @tensorflow/tfjs are browser-only — exclude from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("nsfwjs", "@tensorflow/tfjs");
    }
    return config;
  },
};

export default nextConfig;
