const HtmlWebpackPlugin = require('html-webpack-plugin');
const NpmDtsPlugin = require('npm-dts-webpack-plugin')
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry : './src/index.ts',
  output : {
    path : path.resolve(__dirname, 'dist'),
    filename : 'sdk.js',
    libraryTarget : 'umd',
    umdNamedDefine : true
  },
  resolve : {extensions : ['.ts']},
  devtool : 'source-map',
  optimization : {
    minimize : true,
    minimizer : [new TerserPlugin()],
  },
  module : {
    rules : [{
      test : /\.ts?$/,
      use : 'ts-loader',
      exclude : /node_modules/,
    }]
  },
  plugins :
  [
    new HtmlWebpackPlugin({
      template : path.resolve(__dirname, 'example/index.ejs'),
      inject : 'head',
    }),
    new NpmDtsPlugin({
      output: path.resolve(__dirname, 'dist/index.d.ts'),
      logLevel: "warn"
    })
  ]
};