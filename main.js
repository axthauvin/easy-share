const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// One Easy-Share at a time: a second launch just focuses the first window
// instead of starting another server on yet another port.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Start the existing Express/WebSocket server. It picks the first free port
// from 3000 upwards and resolves `ready` with the one it actually got.
const { ready: serverReady } = require('./server.js');

let mainWindow = null;

// Pick "name (2).ext", "name (3).ext"... when the file already exists
function uniquePath(dir, fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let candidate = path.join(dir, fileName);
  let n = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${base} (${n})${ext}`);
    n++;
  }
  return candidate;
}

function createWindow(port) {
  const win = new BrowserWindow({
    width: 950,
    height: 750,
    minWidth: 420,
    minHeight: 520,
    icon: path.join(__dirname, 'public', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f5f5f7',
      symbolColor: '#1d1d1f',
      height: 36
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Received files go straight to Downloads instead of one save dialog per
  // file, which is unusable when someone sends 30 videos at once.
  win.webContents.session.on('will-download', (event, item) => {
    const target = uniquePath(app.getPath('downloads'), item.getFilename());
    item.setSavePath(target);
    item.once('done', (_e, state) => {
      if (win.isDestroyed()) return;
      win.webContents.send('download-done', {
        fileName: path.basename(target),
        path: target,
        state
      });
    });
  });

  // Links that would open a new window go to the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load our own server, on whatever port it ended up on
  win.loadURL(`http://localhost:${port}`);
  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

ipcMain.on('show-in-folder', (_event, filePath) => {
  if (typeof filePath !== 'string') return;
  // only reveal files we saved into Downloads
  const downloads = path.resolve(app.getPath('downloads'));
  if (path.resolve(filePath).startsWith(downloads + path.sep)) {
    shell.showItemInFolder(filePath);
  }
});

app.whenReady().then(async () => {
  let port;
  try {
    port = await serverReady;
  } catch (err) {
    dialog.showErrorBox(
      'Easy-Share',
      `Impossible de démarrer le serveur local / Could not start the local server.\n\n${err.message}`
    );
    app.quit();
    return;
  }

  createWindow(port);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
