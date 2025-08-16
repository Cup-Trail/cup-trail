const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both app and root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure proper resolution for Expo Router
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs'];

module.exports = config;
