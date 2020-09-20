var devMode = "development";

// Shortcuts -
// - globalShortcut.register('tangent') är global shortcut
// - accelerator: 'CmdOrCtrl+w' är local Shortcut
const path = require("path");
const os = require("os");
const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  shell,
} = require("electron");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-Mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const slash = require("slash");

process.env.NODE_ENV = devMode;

const isDev = process.env.NODE_ENV !== "development" ? true : false;
const isWin = process.platform === "win32" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let aboutWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image compresser",
    width: isDev ? 700 : 400,
    height: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`, // add icon has to use ` to compile with dirname to avoid errors.
    resizable: isDev ? true : false,
    backgroundColor: "white",
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: isDev ? false : true,
  });
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.loadURL(`file://${__dirname}/app/index.html`);
  // loadFile() also works
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: "About Image optimiser",
    width: 300,
    height: 300,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`, // add icon has to use ` to compile with dirname to avoid errors.
    resizable: false,
  });

  aboutWindow.loadURL(`file://${__dirname}/app/about.html`);
  // loadFile() also works
}
app.on("ready", () => {
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  //   globalShortcut.register("CmdOrCtrl+R", () => mainWindow.reload());
  //   globalShortcut.register("CmdOrCtrl+I", () => mainWindow.toggleDevTools());
  //   mainWindow.on("closed", () => (mainWindow = null));
});
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "about",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            {
              role: "reload",
            },
            {
              role: "forcereload",
            },
            {
              type: "separator",
            },
            {
              role: "toggledevtools",
            },
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

ipcMain.on("image:minimize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageshrink");
  shrinkImage(options);
  console.log(options);
});

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({
          quality: [pngQuality, pngQuality],
        }),
      ],
    });

    console.log(files);

    //     Changed from shell.openItem() for v9
    shell.openPath(dest);
  } catch (err) {
    console.log(err);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    //Makes the app stay active even if clicked on close button. Like spotify or discord Kind of minizimes it. Often used on mac.
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // On mac os its common to re-create a window in th4e app wheen
    // dock icon is clicked and there is no other windowws oopen
    createMainWindow();
  }
});
