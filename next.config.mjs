import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nsfwModels = path.join(__dirname, "node_modules", "nsfwjs", "dist", "esm", "model_imports");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // nsfwjs and @tensorflow/tfjs are browser-only — exclude from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("nsfwjs", "@tensorflow/tfjs");
    }

    // We load the NSFW model from CDN at runtime, so the bundled model
    // weight files (30MB+ of UMD shards with dynamic require()) are not
    // needed. Alias the model_imports to empty modules so webpack never
    // tries to parse or bundle them.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      [path.join(nsfwModels, "inception_v3.js")]: false,
      [path.join(nsfwModels, "mobilenet_v2.js")]: false,
      [path.join(nsfwModels, "mobilenet_v2_mid.js")]: false,
    };

    return config;
  },
};

export default nextConfig;
