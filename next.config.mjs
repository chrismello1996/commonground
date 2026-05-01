/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // nsfwjs and @tensorflow/tfjs are browser-only — exclude from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("nsfwjs", "@tensorflow/tfjs");
    }

    // nsfwjs bundles model weight shards as UMD files with dynamic require()
    // that webpack cannot statically analyse. We load the MobileNetV2 model
    // from CDN at runtime via nsfwjs.load("MobileNetV2"), so these bundled
    // model files don't need to be parsed by webpack.
    config.module = config.module || {};
    config.module.noParse = [
      ...(Array.isArray(config.module.noParse) ? config.module.noParse : []),
      /nsfwjs[\\/]dist[\\/]models/,
    ];

    return config;
  },
};

export default nextConfig;
