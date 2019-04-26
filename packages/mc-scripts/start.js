/* eslint-disable no-console */

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const createDevServerConfig = require('./config/webpack-dev-server.config');

// Resolve the absolute path of the caller location. This is necessary
// to point to files within that folder.
const appPackagePath = process.cwd();
const paths = {
  packageJson: path.join(appPackagePath, 'package.json'),
  appPublic: path.join(appPackagePath, 'public'),
  appWebpackConfig: path.join(appPackagePath, 'webpack.config.dev.js'),
};

const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appWebpackConfig])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.HTTP_PORT, 10) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const getApplicationName = () => {
  const packageJsonData = fs.readFileSync(paths.packageJson, {
    encoding: 'utf8',
  });
  return JSON.parse(packageJsonData).name;
};

// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `detect()` Promise resolves to the next free port.
choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const urls = prepareUrls(protocol, HOST, port);
    // Get webpack config
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const config = require(paths.appWebpackConfig);
    // Create a webpack compiler that is configured with custom messages.
    const compiler = createCompiler(
      webpack,
      config,
      getApplicationName(),
      urls,
      useYarn
    );
    // Serve webpack assets generated by the compiler over a web sever.
    const serverConfig = createDevServerConfig({
      allowedHost: urls.localUrlForBrowser,
      contentBase: paths.appPublic,
      publicPath: config.output.publicPath,
    });
    const devServer = new WebpackDevServer(compiler, serverConfig);
    // Launch WebpackDevServer.
    devServer.listen(port, HOST, err => {
      if (err) {
        console.log(err);
        return;
      }
      if (isInteractive) {
        clearConsole();
      }
      console.log(chalk.cyan('Starting the development server...\n'));
      openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, () => {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
