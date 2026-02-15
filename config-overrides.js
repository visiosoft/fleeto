const { InjectManifest } = require('workbox-webpack-plugin');

module.exports = function override(config, env) {
  // Remove the default ManifestPlugin
  config.plugins = config.plugins.filter(
    (plugin) => plugin.constructor.name !== 'GenerateSW'
  );

  if (env === 'production') {
    // Add the InjectManifest plugin
    config.plugins.push(
      new InjectManifest({
        swSrc: './src/service-worker.js',
        swDest: 'service-worker.js',
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        exclude: [
          /\.map$/,
          /^manifest.*\.js$/,
          /\.LICENSE\.txt$/,
          /asset-manifest\.json$/,
        ],
      })
    );
  }

  return config;
};
