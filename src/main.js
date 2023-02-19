// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./server');

console.log('electron version started');

const walletsFile = app.commandLine.getSwitchValue('wallets');
const settingsFile = app.commandLine.getSwitchValue('settings');

const startApp = async () => {
  await server.startServer(settingsFile, walletsFile);

  const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
    });

    const p = path.join(__static, '/index.html');
    console.log(p);
    win.loadFile(p);
  };

  app.whenReady().then(() => {
    createWindow();
  });
};

startApp();
