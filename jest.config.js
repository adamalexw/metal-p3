const { getJestProjects } = require('@nrwl/jest');

module.exports = {
  projects: [
    ...getJestProjects(),
    '<rootDir>/apps/ui',
    '<rootDir>/apps/api',
    '<rootDir>/libs/album/feature-shell',
    '<rootDir>/libs/album/data-access',
    '<rootDir>/libs/album/ui',
    '<rootDir>/libs/shared/utils',
    '<rootDir>/libs/album/domain',
    '<rootDir>/libs/cover/api',
    '<rootDir>/libs/track/api',
    '<rootDir>/libs/shared/adb',
    '<rootDir>/libs/shared/database',
    '<rootDir>/libs/shared/metal-archives',
    '<rootDir>/libs/shared/file-system',
    '<rootDir>/libs/band/api',
    '<rootDir>/libs/shared/error',
    '<rootDir>/libs/shared/feedback',
    '<rootDir>/libs/cover/data-access',
    '<rootDir>/libs/cover/feature-shell',
    '<rootDir>/libs/cover/ui',
    '<rootDir>/libs/shared/data-access',
    '<rootDir>/libs/track/data-access',
    '<rootDir>/libs/band/data-access',
    '<rootDir>/libs/track/ui',
    '<rootDir>/libs/track/util',
    '<rootDir>/libs/shared/ngrx-store',
    '<rootDir>/libs/album/api',
    '<rootDir>/libs/player/feature-shell',
    '<rootDir>/libs/player/data-access',
    '<rootDir>/libs/player/ui',
    '<rootDir>/libs/player/domain',
    '<rootDir>/libs/maintenance/api',
    '<rootDir>/libs/maintenance/data-access',
    '<rootDir>/libs/maintenance/domain',
    '<rootDir>/libs/maintenance/ui',
    '<rootDir>/libs/maintenance/feature-shell',
    '<rootDir>/libs/shared/navigation',
    '<rootDir>/libs/playlist/api',
    '<rootDir>/libs/playlist/data-access',
    '<rootDir>/libs/playlist/feature-shell',
    '<rootDir>/libs/playlist/ui',
  ],
};
