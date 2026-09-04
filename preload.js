const { contextBridge, ipcRenderer, webUtils } = require('electron');
let cachedlibrarypaths = null;

contextBridge.exposeInMainWorld('meowapi', {
    getpathforfile(file) {
        try {
            if (webUtils && typeof webUtils.getPathForFile === 'function') {
                return webUtils.getPathForFile(file);
            }
        } catch (err) {}
        return file.path || '';
    },



    async ensurelibrary() {
        cachedlibrarypaths = await ipcRenderer.invoke('meow:ensure-library');
        return cachedlibrarypaths;
    },

    listsongfilenames() {
        return ipcRenderer.invoke('meow:list-song-filenames');
    },

    picksongfiles() {
        return ipcRenderer.invoke('meow:pick-songs');
    },

    readsongmetadata(filepath) {
        return ipcRenderer.invoke('meow:read-song-metadata', filepath);
    },

    readplaylist() {
        return ipcRenderer.invoke('meow:read-playlist');
    },

    
    writeplaylist(playlist) {
        return ipcRenderer.invoke('meow:write-playlist', playlist);
    },

    readalbums() {
        return ipcRenderer.invoke('meow:read-albums');
    },

    writealbums(albums) {
        return ipcRenderer.invoke('meow:write-albums', albums);
    },

    importsongs(filepaths) {
        return ipcRenderer.invoke('meow:import-songs', filepaths);
    },


    deletesongfile(relsrc) {
        return ipcRenderer.invoke('meow:delete-song-file', relsrc);
    },

    deleteimagefile(relsrc) {
        return ipcRenderer.invoke('meow:delete-image-file', relsrc);
    },

    updatepresence(info) {
        return ipcRenderer.invoke('meow:update-presence', info);
    },

    clearpresence() {
        return ipcRenderer.invoke('meow:clear-presence');
    },

    pickcoverimage() {
        return ipcRenderer.invoke('meow:pick-image');
    },

    importcoverimage(filepath) {
        return ipcRenderer.invoke('meow:import-image', filepath);
    },


    resolvemediapath(relpath) {
        if (!relpath || !cachedlibrarypaths) return relpath;
        const cleanrelpath = relpath.startsWith('./') ? relpath.slice(2) : relpath;
        const dir = cachedlibrarypaths.musicdir.replace(/\\/g, '/');
        const normalizedrel = cleanrelpath.replace(/\\/g, '/');
        const combined = `${dir}/${normalizedrel}`.replace(/\/{2,}/g, '/');
        const iswindowsdrive = /^[a-zA-Z]:\//.test(combined);
        const encoded = encodeURI(combined);
        return iswindowsdrive ? `file:///${encoded}` : `file://${encoded}`;
    }
});