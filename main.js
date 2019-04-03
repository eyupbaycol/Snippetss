const { app, BrowserWindow,dialog } = require('electron')
const { ipcMain } = require('electron')
var path = require('path')
let win
function createWindow () {
  win = new BrowserWindow({ 
      autoHideMenuBar: true,
      icon: path.join(__dirname, 'images/desktopIcon.png') 
})
  win.maximize();
  win.show();
  win.loadFile('index.html')
  win.on('closed', () => {
    win = null
  })
}
ipcMain.on('open-error-dialog', (event) => {
    let options  = {
        buttons: ["Yes","No"],
        message: "Do you really want to delete?"
       }
    let result =dialog.showMessageBox(options);
    event.sender.send('asynchronous-reply',result);
})
app.on('ready', createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})

