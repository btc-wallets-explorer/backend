// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow } = require('electron');
const server = require('./server');

const walletsFile = app.commandLine.getSwitchValue('wallets');
const settingsFile = app.commandLine.getSwitchValue('settings');

const startApp = async () => {
  await server.startServer(settingsFile, walletsFile);

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
    });

    win.loadFile('./dist/index.html');
  };

  app.whenReady().then(() => {
    createWindow();
  });
};

startApp();
