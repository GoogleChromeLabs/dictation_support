process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    files: [
      'src/*_test.ts',
      'src/test_util/*.ts',
    ],
    exclude: [],
    webpack: {
      mode: 'development',
      entry: './src/index.ts',
      output: {filename: 'index.js'},
      resolve: {extensions: ['.js', '.ts', '.json']},
      devtool: 'inline-source-map',
      module: {
        rules: [
          {test: /\.ts$/, use: ['ts-loader']},
        ],
      }
    },
    preprocessors: {
      'src/*_test.ts': ['webpack'],
      'src/test_util/*.ts': ['webpack'],
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
