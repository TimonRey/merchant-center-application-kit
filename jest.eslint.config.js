module.exports = {
  runner: 'jest-runner-eslint',
  displayName: 'eslint',
  testMatch: [
    '<rootDir>/*.js',
    '<rootDir>/packages/**/*.js',
    '<rootDir>/scripts/*.js',
    '<rootDir>/website/**/*.js',
  ],
  watchPlugins: ['jest-plugin-filename', 'jest-watch-master'],
};
