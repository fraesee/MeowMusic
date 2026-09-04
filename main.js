const { app, BrowserWindow, Menu, ipcMain, dialog, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fssync = require('fs');
const { Client: DiscordRPC } = require('@xhayper/discord-rpc');
const { parseFile } = require('music-metadata');

if (require('electron-squirrel-startup')) app.quit();

const discordclientid = '1542806516904497222';
const discordrpc = new DiscordRPC({ clientId: discordclientid });
let discordready = false;
let pendingdiscordactivity;

async function applydiscordpresence(activity) {
    if (!discordready) {
        pendingdiscordactivity = activity;
        return;
    }
    try {
        if (activity) {
            await discordrpc.user?.setActivity(activity);
        } else {
            await discordrpc.user?.clearActivity();
        }
    } catch (err) {
        console.error("Couldn't update discord presence:", err);
    }
}

discordrpc.on('ready', () => {
    discordready = true;
    if (pendingdiscordactivity !== undefined) {
        applydiscordpresence(pendingdiscordactivity);
        pendingdiscordactivity = undefined;
    }
});

discordrpc.login().catch(err => console.error("Couldn't connect to discord:", err));


function getlibrarypaths() {
    const documentsdir = app.getPath('documents');
    const musicdir = path.join(documentsdir, 'MeowMusic');
    const songsdir = path.join(musicdir, 'songs');
    const imagesdir = path.join(musicdir, 'images');
    const playlistpath = path.join(musicdir, 'playlist.json');
    const albumspath = path.join(musicdir, 'albums.json');
    return { musicdir, songsdir, imagesdir, playlistpath, albumspath };
}

async function ensurelibraryfolders() {
    const librarypaths = getlibrarypaths();
    await fs.mkdir(librarypaths.songsdir, { recursive: true });
    await fs.mkdir(librarypaths.imagesdir, { recursive: true });
    try {
        await fs.access(librarypaths.playlistpath);
    } catch {
        await fs.writeFile(librarypaths.playlistpath, '[]', 'utf-8');
    }
    try {
        await fs.access(librarypaths.albumspath);
    } catch {
        await fs.writeFile(librarypaths.albumspath, '[]', 'utf-8');
    }
    return librarypaths;
}





async function uniquedestname(destdir, filename) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    let candidate = filename;
    let counter = 1;
    while (fssync.existsSync(path.join(destdir, candidate))) {
        candidate = `${base} (${counter})${ext}`;
        counter += 1;
    }
    return candidate;
}

function getwindowstatepath() {
    return path.join(app.getPath('userData'), 'window-state.json');
}

function loadwindowstate() {
    try {
        const parsed = JSON.parse(fssync.readFileSync(getwindowstatepath(), 'utf-8'));
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') return parsed;
    } catch {}
    return null;
}

function isonscreen(bounds) {
    if (typeof bounds.x !== 'number' || typeof bounds.y !== 'number') return false;
    return screen.getAllDisplays().some(display => {
        const area = display.workArea;
        return bounds.x >= area.x
            && bounds.y >= area.y
            && bounds.x + bounds.width <= area.x + area.width
            && bounds.y + bounds.height <= area.y + area.height;
    });
}

function capturewindowstate(win) {
    const ismaximized = win.isMaximized();
    const bounds = ismaximized ? win.getNormalBounds() : win.getBounds();
    return { ...bounds, ismaximized };
}

function writewindowstate(state) {
    try {
        fssync.writeFileSync(getwindowstatepath(), JSON.stringify(state));
    } catch (err) {
        console.error("Couldn't save window state:", err);
    }
}

let savewindowstatetimer = null;
function queuewindowstatesave(win) {
    clearTimeout(savewindowstatetimer);
    savewindowstatetimer = setTimeout(() => {
        if (!win.isDestroyed()) writewindowstate(capturewindowstate(win));
    }, 300);
}

function createWindow () {
  const savedstate = loadwindowstate();
  const bounds = savedstate
    ? { width: savedstate.width, height: savedstate.height, x: savedstate.x, y: savedstate.y }
    : { width: 1920, height: 1080 };

  if (!isonscreen(bounds)) {
    delete bounds.x;
    delete bounds.y;
  }

  const win = new BrowserWindow({
    ...bounds,
    show: true,
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'images', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (savedstate && savedstate.ismaximized) win.maximize();

  Menu.setApplicationMenu(null);
  win.loadFile('index.html');

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  win.on('resize', () => queuewindowstatesave(win));
  win.on('move', () => queuewindowstatesave(win));
  win.on('close', () => {
    clearTimeout(savewindowstatetimer);
    if (!win.isDestroyed()) writewindowstate(capturewindowstate(win));
  });
}

ipcMain.handle('meow:ensure-library', async () => {
    return ensurelibraryfolders();
});

ipcMain.handle('meow:list-song-filenames', async () => {
    const librarypaths = await ensurelibraryfolders();
    try {
        return await fs.readdir(librarypaths.songsdir);
    } catch (err) {
        console.error("Couldn't list existing songs:", err);
        return [];
    }
});

ipcMain.handle('meow:read-playlist', async () => {
    const librarypaths = await ensurelibraryfolders();
    try {
        const raw = await fs.readFile(librarypaths.playlistpath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Couldn't read playlist.json:", err);
        return [];
    }
});

ipcMain.handle('meow:write-playlist', async (event, playlist) => {
    const librarypaths = await ensurelibraryfolders();
    try {
        await fs.writeFile(librarypaths.playlistpath, JSON.stringify(playlist, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error("Couldn't write playlist.json:", err);
        return false;
    }
});

ipcMain.handle('meow:read-albums', async () => {
    const librarypaths = await ensurelibraryfolders();
    try {
        const raw = await fs.readFile(librarypaths.albumspath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Couldn't read albums.json:", err);
        return [];
    }
});

ipcMain.handle('meow:write-albums', async (event, albums) => {
    const librarypaths = await ensurelibraryfolders();
    try {
        await fs.writeFile(librarypaths.albumspath, JSON.stringify(albums, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error("Couldn't write albums.json:", err);
        return false;
    }
});

ipcMain.handle('meow:import-songs', async (event, filepaths) => {
    const librarypaths = await ensurelibraryfolders();
    const imported = [];
    for (const filepath of filepaths) {
        try {
            const originalname = path.basename(filepath);
            const destname = await uniquedestname(librarypaths.songsdir, originalname);
            const destpath = path.join(librarypaths.songsdir, destname);
            await fs.copyFile(filepath, destpath);
            imported.push({ srcpath: filepath, originalname, src: `songs/${destname}` });
        } catch (err) {
            console.error(`Couldn't import song ${filepath}:`, err);
        }
    }
    return imported;
});

ipcMain.handle('meow:pick-songs', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Add songs',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'] }]
    });
    if (result.canceled) return [];
    return result.filePaths;
});

ipcMain.handle('meow:read-song-metadata', async (event, filepath) => {
    try {
        const metadata = await parseFile(filepath, { skipCovers: true });
        return {
            title: metadata.common.title || null,
            artist: metadata.common.artist || null
        };
    } catch (err) {
        console.warn(`Couldn't read metadata for ${filepath}:`, err);
        return null;
    }
});

ipcMain.handle('meow:pick-image', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Choose cover image',
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});

ipcMain.handle('meow:import-image', async (event, filepath) => {
    const librarypaths = await ensurelibraryfolders();
    try {
        const originalname = path.basename(filepath);
        const destname = await uniquedestname(librarypaths.imagesdir, originalname);
        const destpath = path.join(librarypaths.imagesdir, destname);
        await fs.copyFile(filepath, destpath);
        return `./images/${destname}`;
    } catch (err) {
        console.error(`Couldn't import cover image ${filepath}:`, err);
        return null;
    }
});

ipcMain.handle('meow:delete-song-file', async (event, relsrc) => {
    const librarypaths = await ensurelibraryfolders();
    try {
        const cleanrelsrc = String(relsrc || '').replace(/^\.?\/*/, '');
        const filename = path.basename(cleanrelsrc);
        const targetpath = path.join(librarypaths.songsdir, filename);


        if (path.dirname(targetpath) !== librarypaths.songsdir) return false;
        await fs.unlink(targetpath);
        return true;
    } catch (err) {
        console.error(`Couldn't delete song file for ${relsrc}:`, err);
        return false;
    }
});

ipcMain.handle('meow:delete-image-file', async (event, relsrc) => {
    const librarypaths = await ensurelibraryfolders();
    try {
        const cleanrelsrc = String(relsrc || '').replace(/^\.?\/*/, '');
        const filename = path.basename(cleanrelsrc);
        const targetpath = path.join(librarypaths.imagesdir, filename);

        if (path.dirname(targetpath) !== librarypaths.imagesdir) return false;
        await fs.unlink(targetpath);
        return true;
    } catch (err) {
        console.error(`Couldn't delete image file for ${relsrc}:`, err);
        return false;
    }
});

const coverartcache = new Map();

async function lookupcoverart(title, artist) {
    const key = `${(artist || '').toLowerCase()}|${(title || '').toLowerCase()}`;
    if (coverartcache.has(key)) return coverartcache.get(key);

    let coverurl = null;
    try {
        const safetitle = (title || '').replace(/"/g, "'");
        const safeartist = (artist || '').replace(/"/g, "'");
        const query = safeartist ? `track:"${safetitle}" artist:"${safeartist}"` : safetitle;
        const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`);
        if (response.ok) {
            const data = await response.json();
            const match = data.data && data.data[0];
            if (match && match.album && match.album.cover_big) {
                coverurl = match.album.cover_big;
            }
        }
    } catch (err) {
        console.error("Couldn't look up cover art:", err);
    }

    coverartcache.set(key, coverurl);
    return coverurl;
}

ipcMain.handle('meow:update-presence', async (event, info) => {
    if (!info) {
        await applydiscordpresence(null);
        return;
    }
    const coverurl = await lookupcoverart(info.title, info.artist);
    const elapsedms = Math.max(0, Math.floor((info.position || 0) * 1000));
    await applydiscordpresence({
        details: info.title || 'Listening to music',
        state: info.artist ? `by ${info.artist}` : undefined,
        largeImageKey: coverurl || 'logo',
        largeImageText: info.artist ? `${info.artist} - ${info.title}` : (info.title || 'MeowMusic'),
        smallImageKey: 'play',
        smallImageText: 'Playing',
        startTimestamp: Date.now() - elapsedms,
        instance: false
    });
});

ipcMain.handle('meow:clear-presence', async () => {
    await applydiscordpresence(null);
});

app.whenReady().then(() => {
  ensurelibraryfolders().catch(err => console.error("Couldn't set up MeowMusic library folders:", err));
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (discordready) discordrpc.user?.clearActivity().catch(() => {});
  if (process.platform !== 'darwin') app.quit();
});