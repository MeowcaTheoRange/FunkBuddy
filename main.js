// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog, shell} = require('electron')
const path = require('path');
const { uIOhook } = require('uiohook-napi');
const fs = require("fs");
var thePath = path.join(app.getPath("home"), ".FunkBuddy");

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    frame: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  if (!fs.existsSync(thePath)) {
    fs.mkdirSync(thePath);
  }

  if (!fs.existsSync(path.join(thePath, "config.json"))) {
    fs.writeFileSync(path.join(thePath, "config.json"), JSON.stringify({
      "binds": {
        "A": "left",
        "S": "down",
        "W": "up",
        "D": "right",
        "ArrowLeft": "left",
        "ArrowDown": "down",
        "ArrowUp": "up",
        "ArrowRight": "right",
        "idle": "idle"
      },
      "charZoom": "0.5",
      "opacity": "1",
      "fps": "15",
      "align": [
        "initial",
        "0",
        "initial",
        "0"
      ]
    }, null, 2));
  }

  if (!fs.existsSync(path.join(thePath, "char.png")) || !fs.existsSync(path.join(thePath, "char.xml"))) {
    fs.copyFileSync(path.join(app.getAppPath(), 'web', 'assets', 'jim.png'), path.join(thePath, "char.png"));
    fs.copyFileSync(path.join(app.getAppPath(), 'web', 'assets', 'jim.xml'), path.join(thePath, "char.xml"));
  }

  ipcMain.handle('resizeToSprite', (e, w, h) => {
    mainWindow.setResizable(true);
    mainWindow.setSize(w, h);
    mainWindow.setResizable(false);
  });

  ipcMain.handle('openURL', (e, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('closeApp', (e) => {
    app.quit();
  });

  ipcMain.handle('promptForImage', (e) => {
    dialog.showOpenDialog({properties: ['openFile'] }).then(function (response) {
      if (!response.canceled) {
        mainWindow.webContents.send('configGotImage', response);
      }
    });
  });

  ipcMain.handle('promptForXml', (e) => {
    dialog.showOpenDialog({properties: ['openFile'] }).then(function (response) {
      if (!response.canceled) {
        mainWindow.webContents.send('configGotXml', response);
      }
    });
  });

  uIOhook.on("keydown", (key) => {
    mainWindow.webContents.send('keydown', key);
  })
  uIOhook.on("keyup", (key) => {
    mainWindow.webContents.send('keyup', key);
  })

  ipcMain.handle('copyFiles', (e, img, xml) => {
    fs.copyFile(img, path.join(thePath, "char.png"), (err) => {
      if (err) alert("File error, stat " + fileval);
    });
    fs.copyFile(xml, path.join(thePath, "char.xml"), (err) => {
      if (err) alert("File error, stat " + fileval);
    });
  });
  ipcMain.handle('writeConfig', (e, obj) => {
    fs.writeFileSync(path.join(thePath, "config.json"), obj);
  });

  ipcMain.handle('navApp', (e, obj) => {
    mainWindow.loadFile(obj);
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.send('configPath', thePath);
    });
  });

  // and load the index.html of the app.
  mainWindow.loadFile('web/index.html');
  mainWindow.webContents.send('configPath', thePath);
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  
  uIOhook.start();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
