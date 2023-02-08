// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow } = require('electron');
const server = require('./server');

app.commandLine.appendSwitch('wallets', undefined);
app.commandLine.appendSwitch('settings', undefined);

const walletsFile = app.commandLine.getSwitchValue('wallets');
const settingsFile = app.commandLine.getSwitchValue('settings');

server.startServer(settingsFile, walletsFile);

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
