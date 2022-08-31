var webpackConfig = require('./webpack.config');

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'src/**/*_test.ts',
      'src/test_util/**/*.ts',
    ],
    exclude: [],
    preprocessors: {
      '**/*.ts': ['webpack'],
    },
    webpack: {
      module: webpackConfig.module,
      resolve: webpackConfig.resolve,
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity
  })
}
