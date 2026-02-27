const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true, // Hides the ugly file menu
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Required for your code structure
      webviewTag: true, // Enables the <webview> tag
    }
  });

  // Handle permissions for the embedded browser (Cam/Mic for Zoom/Whatsapp)
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'geolocation', 'fullscreen', 'notifications'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  win.loadFile('Index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});