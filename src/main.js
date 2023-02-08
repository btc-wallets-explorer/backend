const server = require('./server');

server.startServer();

// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow } = require('electron');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile('./build/index.html');
};

app.whenReady().then(() => {
  createWindow();
});
