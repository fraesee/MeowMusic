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

    readplaylist() {
        return ipcRenderer.invoke('meow:read-playlist');
    },

    
    writeplaylist(playlist) {
        return ipcRenderer.invoke('meow:write-playlist', playlist);
    },

    importsongs(filepaths) {
        return ipcRenderer.invoke('meow:import-songs', filepaths);
    },


    deletesongfile(relsrc) {
        return ipcRenderer.invoke('meow:delete-song-file', relsrc);
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

//do i even need cover images anymore?
    importcoverimage(filepath) {
        return ipcRenderer.invoke('meow:import-image', filepath);
    },



    //copied
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