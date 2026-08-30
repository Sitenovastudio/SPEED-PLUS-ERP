const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let printWorkerWindow;

function createWindows() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // Background worker for silent printing
  printWorkerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (printWorkerWindow) printWorkerWindow.close();
  });
}

app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Retrieve all connected hardware printers
ipcMain.handle('get-printers', async () => {
  return await mainWindow.webContents.getPrintersAsync();
});

// IPC Handler: Execute silent thermal print
ipcMain.handle('silent-print', async (event, { htmlContent, printerName }) => {
  return new Promise(async (resolve, reject) => {
    try {
      await printWorkerWindow.webContents.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`
      );

      printWorkerWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: printerName || '',
          margins: { marginType: 'none' },
          pageSize: { width: 58000, height: 297000 }
        },
        (success, errorType) => {
          if (!success) {
            console.error('Silent Print Error:', errorType);
            resolve({ success: false, error: errorType });
          } else {
            console.log('Receipt printed successfully.');
            resolve({ success: true });
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
});
