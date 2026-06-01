process.env.EXPO_ROUTER_APP_ROOT = '../../apps/mobile/app';

const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require('metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: 'mobile',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

const finalConfig = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [],
});

const previousRewrite = finalConfig.server?.rewriteRequestUrl;
finalConfig.server = finalConfig.server || {};
finalConfig.server.rewriteRequestUrl = (url) => {
  const rewritten = previousRewrite ? previousRewrite(url) : url;
  if (!rewritten.includes('transform.routerRoot=')) {
    const sep = rewritten.includes('?') ? '&' : '?';
    return rewritten + sep + 'transform.routerRoot=' + encodeURIComponent('apps/mobile/app');
  }
  return rewritten;
};

module.exports = finalConfig;
