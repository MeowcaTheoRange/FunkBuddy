module.exports = {
  packagerConfig: {
    platforms: ['linux', 'win32', 'darwin']
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['linux', 'win32', 'darwin'],
      config: {},
    }
  ],
};
