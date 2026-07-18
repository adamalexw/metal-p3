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
    // The workspace-root .babelrc supplies babel-preset-expo for all Metro transforms.
    // Disable per-directory .babelrc lookup so apps/mobile/.babelrc.js (kept for jest)
    // doesn't apply the preset a second time ("Duplicate __self prop found").
    enableBabelRCLookup: false,
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

const nxConfig = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [],
});

// withNxMetro derives projectRoot/watchFolders/nodeModulesPaths from @nx/devkit's
// workspaceRoot, which on Windows can carry a lowercase drive letter ("c:\..."). Metro's
// file map then indexes paths under one casing while the resolver returns the other,
// breaking bundling (e.g. "c:\C:\..." empty-module paths, SHA-1 failures on index.js).
// Normalize every absolute path — including resolver results — to __dirname's drive casing.
const normalizeDrive = (p) => (typeof p === 'string' && /^[a-zA-Z]:[\\/]/.test(p) ? __dirname[0] + p.slice(1) : p);
const nxResolveRequest = nxConfig.resolver.resolveRequest;
const finalConfig = {
  ...nxConfig,
  projectRoot: normalizeDrive(nxConfig.projectRoot),
  watchFolders: (nxConfig.watchFolders || []).map(normalizeDrive),
  resolver: {
    ...nxConfig.resolver,
    nodeModulesPaths: (nxConfig.resolver.nodeModulesPaths || []).map(normalizeDrive),
    resolveRequest: (context, moduleName, platform) => {
      const resolution = nxResolveRequest(context, moduleName, platform);
      return resolution && resolution.filePath ? { ...resolution, filePath: normalizeDrive(resolution.filePath) } : resolution;
    },
  },
};

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
