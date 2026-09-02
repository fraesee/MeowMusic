(function () {
    if (!window.meowapi) return;

    const exts = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'];

    let queue = [];
    let skipped = [];
    let isalbum = false;
    let albumcover = null;
    let albumcovername = '';
    let draggedpath = null;
    let busy = false;
    let dragdepth = 0;
    let dupetimer = null;

    function issong(filename) {
        return exts.includes(filename.split('.').pop().toLocaleLowerCase());
    }

    function noext(filename) {
        const dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.slice(0, dot) : filename;
    }

    function newsong(filepath, filename) {
        return { path: filepath, filename, title: noext(filename), artist: '', coverpath: null, covername: '' };
    }

    const notice = document.createElement('div');
    notice.id = 'empty-library-notice';
    notice.className = 'empty-library-notice hidden';
    notice.innerHTML = `
        <span>No songs yet!!!! Drag in (multiple) songs to add them!! or click the add songs button</span>
        <button type="button" id="btn-dismiss-empty-notice" class="close-btn">[x]</button>
    `;
    document.body.appendChild(notice);
    notice.querySelector('#btn-dismiss-empty-notice').addEventListener('click', () => notice.classList.add('hidden'));

    async function checkempty() {
        try {
            await window.meowapi.ensurelibrary();
            const current = await window.meowapi.readplaylist();
            if (current.length === 0) notice.classList.remove('hidden');
        } catch (err) {
            console.warn("can't happen. probably.", err);
        }
    }
    checkempty();
    const dupenotice = document.createElement('div');
    dupenotice.id = 'duplicate-songs-notice';

    dupenotice.className = 'empty-library-notice hidden';
    document.body.appendChild(dupenotice);


    function toast(names) {
        dupenotice.textContent = names.length === 1
            ? `"${names[0]}" is already in your library!`
            : `${names.length} of those songs are already in your library!`;
        dupenotice.classList.remove('hidden');
        clearTimeout(dupetimer);
        dupetimer = setTimeout(() => dupenotice.classList.add('hidden'), 4000);
    }

    const overlay = document.createElement('div');
    overlay.id = 'song-drop-overlay';

    overlay.className = 'song-drop-overlay hidden';

    overlay.innerHTML = `<div class="song-drop-message">Drop music files to add them to MeowMusic!</div>`;
    document.body.appendChild(overlay);

    function isfiledrag(event) {
        return !!(event.dataTransfer && Array.from(event.dataTransfer.types || []).includes('Files'));
    }

    window.addEventListener('dragenter', event => {
        if (!isfiledrag(event)) return;
        event.preventDefault();

        dragdepth += 1;
        overlay.classList.remove('hidden');
    });
    window.addEventListener('dragover', event => {
        if (!isfiledrag(event)) return;
        event.preventDefault();
    });
    window.addEventListener('dragleave', event => {
        if (!isfiledrag(event)) return;
        event.preventDefault();
        dragdepth = Math.max(0, dragdepth - 1);
        if (dragdepth === 0) overlay.classList.add('hidden');
    });
    window.addEventListener('drop', async event => {
        if (!isfiledrag(event)) return;
        event.preventDefault();
        dragdepth = 0;
        overlay.classList.add('hidden');
        if (busy) return;

        const files = Array.from(event.dataTransfer.files || []).filter(file => issong(file.name));
        if (files.length === 0) return;

        const candidates = files
            .map(file => newsong(window.meowapi.getpathforfile(file), file.name))
            .filter(song => song.path);
        if (candidates.length === 0) return;

        await queuesongs(candidates);
    });

    const addbtn = document.getElementById('btn-open-add-songs');

    async function pickfiles() {
        if (busy) return;
        const filepaths = await window.meowapi.picksongfiles();
        if (!filepaths || filepaths.length === 0) return;
        const candidates = filepaths
            .map(filepath => newsong(filepath, filepath.split(/[\\/]/).pop()))
            .filter(song => issong(song.filename));
        await queuesongs(candidates);
    }

    if (addbtn) {
        addbtn.hidden = false;
        addbtn.addEventListener('click', pickfiles);
    }

    document.addEventListener('keydown', event => {
        if (event.code !== 'Space' && event.key !== ' ') return;

        const target = event.target;
        if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement ||
            (target && target.isContentEditable)
        ) return;
        if (!dialog.hidden || busy) return;

        event.preventDefault();
        pickfiles();
    });


    async function queuesongs(candidates) {
        if (candidates.length === 0) return;

        let existing = [];
        try {
            existing = await window.meowapi.listsongfilenames();
        } catch (err) {
            console.warn("can't happen. probably.", err);
        }

        const existingset = new Set(existing.map(name => name.toLocaleLowerCase()));

        const fresh = [];
        const dupes = [];
        const seen = new Set();
        candidates.forEach(song => {

            const lower = song.filename.toLocaleLowerCase();
            if (existingset.has(lower) || seen.has(lower)) {
                dupes.push(song.filename);
                return;
            }
            seen.add(lower);
            fresh.push(song);
        });

        queue = fresh;
        skipped = dupes;

        if (queue.length === 0) {
            if (dupes.length > 0) toast(dupes);
            return;
        }
        showdialog();
    }

    const dialog = document.createElement('div');
    dialog.id = 'import-songs-dialog';
    dialog.className = 'album-dialog import-songs-dialog';
    dialog.hidden = true;
    dialog.innerHTML = `
        <div class="album-dialog-backdrop"></div>
        <div class="album-dialog-window import-dialog-window">
            <strong id="import-dialog-title">Add songs to MeowMusic!</strong>
            <div class="import-album-toggle-row">
                <label><input type="checkbox" id="import-album-toggle"> Songs are an album?</label>

            </div>
            <div id="import-album-fields" class="import-album-fields hidden">
                <input type="text" id="import-album-name" maxlength="80" placeholder="Album name">
                <button type="button" id="btn-import-album-cover" class="forum-btn-sm">Choose album cover</button>
                <span id="import-album-cover-name" class="import-cover-name"></span>
            </div>

            <span id="import-reorder-hint" class="import-reorder-hint hidden">Drag rows to set the track order.</span>
            <ul id="import-song-list" class="album-song-list import-song-list"></ul>
            <span id="import-status" class="album-action-status" aria-live="polite"></span>
            <div class="album-dialog-actions">
                <button type="button" id="btn-cancel-import" class="forum-btn-sm">Cancel</button>
                <button type="button" id="btn-confirm-import" class="forum-btn-sm">Add songs</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const albumcheck = dialog.querySelector('#import-album-toggle');
    const albumfields = dialog.querySelector('#import-album-fields');

    const albumnameinput = dialog.querySelector('#import-album-name');
    const albumcoverbtn = dialog.querySelector('#btn-import-album-cover');

    const albumcovertext = dialog.querySelector('#import-album-cover-name');
    const reorderhint = dialog.querySelector('#import-reorder-hint');
    const queuelist = dialog.querySelector('#import-song-list');

    const statusline = dialog.querySelector('#import-status');
    const cancelbtn = dialog.querySelector('#btn-cancel-import');
    const confirmbtn = dialog.querySelector('#btn-confirm-import');

    function showdialog() {
        isalbum = false;

        albumcover = null;

        albumcovername = '';

        albumcheck.checked = false;
        albumfields.classList.add('hidden');
        reorderhint.classList.add('hidden');
        albumnameinput.value = '';
        albumcovertext.textContent = '';
        statusline.textContent = skipped.length > 0
            ? `Skipped ${skipped.length} already in your library: ${skipped.join(', ')}`
            : '';
        renderqueue();
        dialog.hidden = false;
    }

    function hidedialog() {
        dialog.hidden = true;
        queue = [];
    }

    cancelbtn.addEventListener('click', () => {
        if (busy) return;
        hidedialog();
    });

    albumcheck.addEventListener('change', () => {
        isalbum = albumcheck.checked;
        albumfields.classList.toggle('hidden', !isalbum);
        reorderhint.classList.toggle('hidden', !isalbum);
        renderqueue();
    });

    albumcoverbtn.addEventListener('click', async () => {
        const picked = await window.meowapi.pickcoverimage();
        if (!picked) return;
        albumcover = picked;
        albumcovername = picked.split(/[\\/]/).pop();
        albumcovertext.textContent = albumcovername;
    });

    function renderqueue() {
        queuelist.innerHTML = '';
        queue.forEach((song, index) => {
            const item = document.createElement('li');
            item.className = 'album-song-item import-song-item';
            item.draggable = isalbum;
            item.dataset.path = song.path;

            if (isalbum) {
                const handle = document.createElement('span');
                handle.className = 'import-drag-handle';
                handle.textContent = '::';
                handle.title = 'Drag to reorder';
                item.appendChild(handle);

                const number = document.createElement('span');
                number.className = 'album-track-number';
                number.textContent = `${index + 1}.`;
                item.appendChild(number);
            }

            const filenamespan = document.createElement('span');
            filenamespan.className = 'import-original-filename';
            filenamespan.textContent = song.filename;
            filenamespan.title = song.filename;
            item.appendChild(filenamespan);

            const titleinput = document.createElement('input');
            titleinput.type = 'text';
            titleinput.className = 'import-title-input';
            titleinput.placeholder = 'Song title';
            titleinput.maxLength = 120;
            titleinput.value = song.title;
            titleinput.addEventListener('input', () => { song.title = titleinput.value; });
            item.appendChild(titleinput);

            const artistinput = document.createElement('input');
            artistinput.type = 'text';
            artistinput.className = 'import-artist-input';
            artistinput.placeholder = 'Artist name';
            artistinput.maxLength = 120;
            artistinput.value = song.artist;
            artistinput.addEventListener('input', () => { song.artist = artistinput.value; });
            item.appendChild(artistinput);

            if (!isalbum) {
                const coverbtn = document.createElement('button');
                coverbtn.type = 'button';
                coverbtn.className = 'forum-btn-sm import-cover-btn';
                coverbtn.textContent = song.covername ? 'Cover ✓' : 'Cover';
                coverbtn.title = song.covername || 'Choose a cover image! (optional)';
                coverbtn.addEventListener('click', async () => {
                    const picked = await window.meowapi.pickcoverimage();
                    if (!picked) return;
                    song.coverpath = picked;
                    song.covername = picked.split(/[\\/]/).pop();
                    coverbtn.textContent = 'Cover ✓';
                    coverbtn.title = song.covername;
                });
                item.appendChild(coverbtn);
            }

            const removebtn = document.createElement('button');
            removebtn.type = 'button';
            removebtn.className = 'album-remove-song';
            removebtn.textContent = '[x]';
            removebtn.addEventListener('click', () => {
                queue = queue.filter(entry => entry.path !== song.path);
                if (queue.length === 0) {
                    hidedialog();
                    return;
                }
                renderqueue();
            });
            item.appendChild(removebtn);

            if (isalbum) {
                item.addEventListener('dragstart', event => {
                    draggedpath = song.path;
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', song.path);
                });
                item.addEventListener('dragover', event => event.preventDefault());
                item.addEventListener('drop', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    const frompath = draggedpath || event.dataTransfer.getData('text/plain');
                    const fromindex = queue.findIndex(entry => entry.path === frompath);
                    const toindex = queue.findIndex(entry => entry.path === song.path);
                    if (fromindex < 0 || toindex < 0 || fromindex === toindex) return;
                    const [moved] = queue.splice(fromindex, 1);
                    queue.splice(toindex, 0, moved);
                    draggedpath = null;
                    renderqueue();
                });
                item.addEventListener('dragend', () => { draggedpath = null; });
            }

            queuelist.appendChild(item);
        });
    }

    confirmbtn.addEventListener('click', async () => {
        if (busy || queue.length === 0) return;
        if (queue.some(song => !song.title.trim())) {
            statusline.textContent = 'Songs need a title silly!!';
            return;
        }
        if (isalbum && !albumnameinput.value.trim()) {
            albumnameinput.focus();
            statusline.textContent = 'Give the album a name!!!!';
            return;
        }

        busy = true;
        confirmbtn.disabled = true;
        cancelbtn.disabled = true;
        statusline.textContent = '...LOADING SONGS...';

        try {
            const waslibraryempty = playlist.length === 0;
            const copied = await window.meowapi.importsongs(queue.map(song => song.path));

            let sharedcover = '';
            if (isalbum && albumcover) {
                sharedcover = (await window.meowapi.importcoverimage(albumcover)) || '';
            }

            const newentries = [];
            for (const song of queue) {
                const match = copied.find(entry => entry.srcpath === song.path);
                if (!match) continue;

                let image = sharedcover;
                if (!isalbum && song.coverpath) {
                    image = (await window.meowapi.importcoverimage(song.coverpath)) || '';
                }

                newentries.push({
                    title: song.title.trim(),
                    artist: song.artist.trim(),
                    src: match.src,
                    image: image || ''
                });
            }

            if (newentries.length === 0) {
                statusline.textContent = "Couldn't add songs.";
                return;
            }

            playlist = playlist.concat(newentries);
            await window.meowapi.writeplaylist(playlist);

            if (isalbum) {
                const newalbum = {
                    id: `album-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    name: albumnameinput.value.trim(),
                    songs: newentries.map(entry => entry.src)
                };
                albums.push(newalbum);
                selectedalbumid = newalbum.id;
                savealbumstorage();
            }

            renderalbums();
            notice.classList.add('hidden');

            if (waslibraryempty && playlist.length > 0) {
                loadtrack(playlist[0], { recordHistory: false });
                songtitle.textContent = 'Now playing: Nothing right now!!';
            }

            hidedialog();
        } catch (err) {
            console.error("can't happen", err);
            statusline.textContent = "Something went wrong... This shouldn't happen.";
        } finally {
            busy = false;
            confirmbtn.disabled = false;
            cancelbtn.disabled = false;
        }
    });
})();