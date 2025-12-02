const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './bin/www',  // The starting point of your app
  output: {
    filename: 'server.js',  // Output file after bundling
    path: path.resolve(__dirname, 'dist'),  // The 'dist' directory
  },
  externals: [nodeExternals()],  // Exclude Node.js modules like express from being bundled
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],  // Ensures compatibility with the target Node.js version
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),  // Correct usage of the plugin
  ],
  target: 'node',  // Ensure Webpack builds for a Node.js environment
  resolve: {
    extensions: ['.js', '.json'],
  },
  devtool: 'source-map',  // Useful for debugging
  mode: process.env.NODE_ENV || 'production',  // Set default mode to production
};


module.exports = {
  entry: './bin/www',  // Entry point for your Express API (the file that starts the server)
  output: {
    filename: 'server.js',  // Output filename for the bundled server code
    path: path.resolve(__dirname, 'dist'),  // Directory where the bundled file will be placed
  },
  externals: [nodeExternals()],  // Exclude node_modules from bundling since they are already available at runtime
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',  // Transpile JavaScript code using Babel
          options: {
            presets: ['@babel/preset-env'],  // Babel preset for Node.js compatibility
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),  // Clean dist folder before every build
  ],
  target: 'node',  // Make sure Webpack targets Node.js environment
  resolve: {
    extensions: ['.js', '.json'],  // Resolve JavaScript and JSON file extensions
  },
  devtool: 'source-map',  // Enable source maps for debugging purposes
  mode: process.env.NODE_ENV || 'production',  // Default to production mode
};