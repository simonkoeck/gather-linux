const {
    app,
    BrowserWindow,
    shell,
    session,
    desktopCapturer,
    Menu,
    powerMonitor,
} = require("electron");

const URL_V2 = "https://app.v2.gather.town/";
const URL_CLASSIC = "https://app.gather.town/";

// Determine URL based on startup flags
let GATHER_URL = process.argv.includes("--classic") ? URL_CLASSIC : URL_V2;

// DISABLE THE NATIVE MENU
Menu.setApplicationMenu(null);

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Gather",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });

    win.loadURL(GATHER_URL, {
        userAgent:
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    session.defaultSession.setPermissionRequestHandler(
        (webContents, permission, callback) => {
            const allowedPermissions = [
                "media",
                "accessibility-events",
                "display-capture",
            ];
            if (allowedPermissions.includes(permission)) {
                callback(true);
            } else {
                callback(false);
            }
        },
    );

    session.defaultSession.setDisplayMediaRequestHandler(
        (request, callback) => {
            // Let the system picker handle source selection
            // Don't call desktopCapturer.getSources() - it triggers a duplicate picker
            callback({});
        },
        {
            useSystemPicker: true,
        },
    );

    // session.defaultSession.setDisplayMediaRequestHandler(
    //     (request, callback) => {
    //         desktopCapturer
    //             .getSources({ types: ["screen", "window"] })
    //             .then((sources) => {
    //                 if (sources.length === 1) {
    //                     callback({ video: sources[0] });
    //                     return;
    //                 }
    //                 const menu = Menu.buildFromTemplate(
    //                     sources.map((source) => {
    //                         return {
    //                             label: source.name,
    //                             click: () => {
    //                                 // Video only (Audio must be excluded to prevent crash)
    //                                 callback({ video: source });
    //                             },
    //                         };
    //                     }),
    //                 );
    //                 menu.popup();
    //             })
    //             .catch((err) => console.log("Screen share error:", err));
    //     },
    //     {
    //         useSystemPicker: true,
    //     },
    // );

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (
            url.startsWith("https://gather.town") ||
            url.includes("accounts.google.com")
        ) {
            return { action: "allow" };
        }
        if (url.startsWith("https://") || url.startsWith("http://")) {
            shell.openExternal(url);
        }
        return { action: "deny" };
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
