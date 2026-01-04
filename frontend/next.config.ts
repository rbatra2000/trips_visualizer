import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    resolveAlias: {
      'plotly.js': 'plotly.js/dist/plotly.js',
    },
  },

  webpack: (config, { isServer }) => {
    // Fix for Plotly.js in Next.js
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'plotly.js': 'plotly.js/dist/plotly.js',
      };
    }

    // Support for Langium .langium files
    config.module.rules.push({
      test: /\.langium$/,
      type: 'asset/source',
    });

    // Allow .js imports to resolve to .ts files (for Langium generated files)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };

    return config;
  },

  // Disable strict mode to prevent double-rendering issues with Monaco/Plotly
  reactStrictMode: false,
};

export default nextConfig;
