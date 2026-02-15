const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

module.exports = function override(config, env) {
  // Remove the default ManifestPlugin or GenerateSW
  config.plugins = config.plugins.filter(
    (plugin) => 
      plugin.constructor.name !== 'GenerateSW' && 
      plugin.constructor.name !== 'InjectManifest'
  );

  if (env === 'production') {
    // Add the InjectManifest plugin
    config.plugins.push(
      new InjectManifest({
        swSrc: path.resolve(__dirname, 'src/service-worker.js'),
        swDest: 'service-worker.js',
        dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
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
