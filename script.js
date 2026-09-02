//lol
const audio = document.getElementById('audio-element');
const songtitle = document.getElementById('song-title');
const lyricstxt = document.getElementById('lyrics-text');
const timedisplay = document.getElementById('time-display');
const durationdisplay = document.getElementById('duration-display');
const seekbar = document.getElementById('seek-bar');
const codecdisplay = document.getElementById('codec-display');
const historylist = document.getElementById('history-list');
const lyricspanel = document.getElementById('lyrics-panel');
const lyricsbutton = document.getElementById('btn-lyrics-toggle');
const closelyricsbutton = document.getElementById('btn-close-lyrics');
const themebutton = document.getElementById('btn-theme-toggle');
const loopbutton = document.getElementById('btn-loop');
const restartbutton = document.getElementById('btn-restart');
const replaybutton = document.getElementById('btn-replay');
const replaymenu = document.getElementById('replay-menu');
const replaystartinput = document.getElementById('replay-start');
const replayendinput = document.getElementById('replay-end');
const volpanel = document.getElementById('volume-panel');
const volbutton = document.getElementById('btn-volume-toggle');
const closevolbutton = document.getElementById('btn-close-volume');
const historypanel = document.querySelector('.post-attachments-row .attachment-box');
const statspanel = document.querySelectorAll('.post-attachments-row .attachment-box')[1];
const closehisbutton = document.getElementById('btn-close-history');
const closestatsbutton = document.getElementById('btn-close-stats');
const postlayout = document.querySelector('.post-layout');
const historyrow = document.querySelector('.post-attachments-row');
const historybutton = document.getElementById('btn-history-toggle');
const statsbutton = document.getElementById('btn-stats-toggle');
const albumsbutton = document.getElementById('btn-albums-toggle');
const albumpanel = document.getElementById('album-attachment');
const closealbumbutton = document.getElementById('btn-close-album');
const albumnameinp = document.getElementById('album-name');
const createalbumbutton = document.getElementById('btn-create-album');
const albumselect = document.getElementById('album-select');
const deletealbum = document.getElementById('btn-delete-album');
const albumsort = document.getElementById('album-song-sort');
const songlist = document.getElementById('available-songs-list');
const albumplaylist = document.getElementById('album-playlist-list');
const selalbumtitle = document.getElementById('selected-album-title');
const playalbum = document.getElementById('btn-play-album');
const loopalbum = document.getElementById('btn-loop-album');
const renamealbum = document.getElementById('btn-rename-album');
const albumrenamerow = document.getElementById('album-rename-row');
const albumrenameinput = document.getElementById('album-rename-input');
const savealbum_rename = document.getElementById('btn-save-album-rename');
const cancelalbum_rename = document.getElementById('btn-cancel-album-rename');
const selectionadd = document.getElementById('btn-add-selected-songs');
const albumactionstat = document.getElementById('album-action-status');
const allsongselect = document.getElementById('btn-select-all-songs');
const clearsongsbutton = document.getElementById('btn-clear-song-selection');
const albumsearch = document.getElementById('album-song-search');
const deletepopup = document.getElementById('delete-album-dialog');
const deletemessage = document.getElementById('delete-album-message');
const canceldeletealbum = document.getElementById('btn-cancel-delete-album');
const confirmdeletealbum = document.getElementById('btn-confirm-delete-album');
const deletesongpopup = document.getElementById('delete-song-dialog');
const deletesongtitle = document.getElementById('delete-song-title');
const deletesongmessage = document.getElementById('delete-song-message');
const canceldeletesong = document.getElementById('btn-cancel-delete-song');
const confirmdeletesong = document.getElementById('btn-confirm-delete-song');
const avatarimage = document.querySelectorAll('.pfp-image');
const tracksplayed_stat = document.getElementById('stats-tracks-played');
const listentime_stat = document.getElementById('stats-listened-time');
const differentartist_stat = document.getElementById('stats-unique-artists');
const mostplayedsong_stat = document.getElementById('stats-most-played-song');
const mostplayartist_stat = document.getElementById('stats-most-played-artist');
const volslider = document.getElementById('volume-slider');
const volVALUE = document.getElementById('volume-value');
const ratingval = document.getElementById('rating-value');
const tworatingvalue = document.querySelectorAll('.rating-value-secondary');
const ratingupbutton = document.getElementById('btn-rating-up');
const ratingdownbutton = document.getElementById('btn-rating-down');
const userratingbut = document.querySelectorAll('.rating-vote-btn');
const threadratingval = document.getElementById('thread-rating-value');
const threadup = document.getElementById('btn-thread-up');
const threaddown = document.getElementById('btn-thread-down');
let audioCtx, leftAnalyser, rightAnalyser, leftDataArray, rightDataArray, canvas, canvasCtx;
let currenttrack = null;
let lyricstrack = null;
const STATS_STORAGE_KEY = 'meow_stats';
let listeningstats = {
    tracksplayed: 0,
    totalseconds: 0,
    artists: {},
    songs: {}
};
let playlist = [];
let artistLinks = {};
let lastaudiotime = null;
let replayrangeactive = false;
let replaystart = 0;
let replayend = 0;
let startedplayback = false;
let previousvol = 50;

let albumplaybackq = null;
let currentplayingalbumsources = null;

let albumlooptoggle = false;

const RECENT_HISTORY_LIMIT = 6;
let recentlyplayed = [];

function recordplayed(track) {
    if (!track) return;
    recentlyplayed.push(track.src);
    if (recentlyplayed.length > RECENT_HISTORY_LIMIT) {
        recentlyplayed.shift();
    }
}



const HISTORY_STORAGE_KEY = 'meow_history';
let playhistory = [];

function loadhistorystorage() {
    try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.warn("if cannot read history, refreshes.:", err);
        return [];
    }
}

function savehistorytostorage() {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(playhistory));
    } catch (err) {
        console.warn("if cannot save history, well not the end of the world.:", err);
    }
}

function renderhistory() {
    historylist.innerHTML = '';
    if (playhistory.length === 0) {
        const li = document.createElement('li');
        li.className = 'history-empty';
        li.textContent = 'Nothing played yet!';
        historylist.appendChild(li);
        return;
    }
    playhistory.forEach(entry => {
        const li = document.createElement('li');
        const label = entry.artist ? `${entry.artist} - ${entry.title}` : entry.title;
        if (entry.src) {
            const button = document.createElement('button');

            button.type = 'button';
            button.className = 'history-track-link';

            button.textContent = label;
            button.addEventListener('click', () => {
                const track = playlist.find(item => item.src === entry.src);
                if (!track) return;
                loadtrack(track);
                loadcurrenttrackLyrics();

                initaudio();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                audio.play().catch(error => {
                    console.error('Unable to play history track:', error);
                });
            });
            li.appendChild(button);
        } else {
            li.textContent = label;
        }
        historylist.appendChild(li);
    });
}

function addtohistory(track) {
    if (!track) return;
    playhistory.unshift({ title: track.title, artist: track.artist || '', src: track.src });
    if (playhistory.length > RECENT_HISTORY_LIMIT) {
        playhistory.length = RECENT_HISTORY_LIMIT;
    }
    savehistorytostorage();
    renderhistory();
}

async function loadPlaylist() {
    try {
        if (window.meowapi) {
            await window.meowapi.ensurelibrary();
            playlist = await window.meowapi.readplaylist();
        } else {
            const response = await fetch('playlist.json');
            playlist = await response.json();
        }
    } catch (error) {
        console.error("Couldn't load playlist.json UH OH:", error);
        playlist = [];
    }
}

function resolvetracksrc(src) {
    if (window.meowapi && typeof window.meowapi.resolvemediapath === 'function') {
        return window.meowapi.resolvemediapath(src);
    }
    return src;
}

async function loadArtistLinks() {
    try {
        const response = await fetch('artistlinks.json');
        if (response.ok) {
            artistLinks = await response.json();
        }
    } catch (error) {
        console.warn("non issue in electron app ver.:", error);
        artistLinks = {};
    }
}

function loadstatsstorage() {
    try {
        const raw = localStorage.getItem(STATS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== 'object') return listeningstats;
        return {

            tracksplayed: Number.isFinite(parsed.tracksplayed) ? parsed.tracksplayed : 0,
            totalseconds: Number.isFinite(parsed.totalseconds) ? parsed.totalseconds : 0,

            artists: parsed.artists && typeof parsed.artists === 'object' ? parsed.artists : {},
            songs: parsed.songs && typeof parsed.songs === 'object' ? parsed.songs : {}
        };
    } catch (err) {
        console.warn("Couldn't read saved stats, fresh:", err);
        return listeningstats;
    }
}

function savestatsstorage() {
    try {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(listeningstats));
    } catch (err) {
        console.warn("Couldn't save stats to localStorage not big issue:", err);
    }
}

function getmostplayed(counts) {
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'None';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
}

function formatelistenedtime(totalseconds) {

    const totalMinutes = Math.floor(totalseconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;

}

function renderstats() {
    const totalMinutes = Math.floor(listeningstats.totalseconds / 60);
    tracksplayed_stat.textContent = listeningstats.tracksplayed;
    listentime_stat.textContent = formatelistenedtime(listeningstats.totalseconds);

    listentime_stat.parentElement.dataset.totalMinutes =

        `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;

    differentartist_stat.textContent = Object.keys(listeningstats.artists).length;
    mostplayedsong_stat.textContent = getmostplayed(listeningstats.songs);

    mostplayartist_stat.textContent = getmostplayed(listeningstats.artists);

}

function recordtrackstats(track) {
    if (!track) return;
    listeningstats.tracksplayed += 1;
    const artist = track.artist || 'Unknown artist';
    listeningstats.artists[artist] = (listeningstats.artists[artist] || 0) + 1;

    listeningstats.songs[track.title] = (listeningstats.songs[track.title] || 0) + 1;
    savestatsstorage();
    renderstats();
}

const ALBUMS_STORAGE_KEY = 'meow_albums';
const AVATAR_STORAGE_KEY = 'meow_avatar';
let albums = [];
let selectedalbumid = null;
let selectedsongsource = new Set();
let draggedalbumsource = null;
let pendingdeletesongsources = null;

function loadalbumstorage() {
    try {
        const raw = localStorage.getItem(ALBUMS_STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(saved)) return [];
        return saved.map((album, index) => ({
            id: String(album.id || `album-${index}-${Date.now()}`),
            name: String(album.name || 'Untitled album'),
            songs: Array.isArray(album.songs)

                ? album.songs.filter(source => typeof source === 'string')
                : []
        }));
    } catch (err) {
        console.warn("Couldn't read saved albums, starting fresh:", err);
        return [];
    }
}

function savealbumstorage() {
    try {
        localStorage.setItem(ALBUMS_STORAGE_KEY, JSON.stringify(albums));
    } catch (err) {
        console.warn("This should never happen...", err);
    }
}

function getselectedalbum() {
    const selectedId = albumselect.value || selectedalbumid;
    return albums.find(album => album.id === selectedId) || null;
}


function comparealbumtrack(first, second) {
    const sortBy = albumsort.value || 'artist';
    const firstValue = String(first[sortBy] || '').toLocaleLowerCase();

    const secondValue = String(second[sortBy] || '').toLocaleLowerCase();
    return firstValue.localeCompare(secondValue) ||
        String(first.title || '').localeCompare(String(second.title || '')) ||
        String(first.src || '').localeCompare(String(second.src || ''));
}

function renderalbumselect() {
    albumselect.innerHTML = '';
    if (albums.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Create an album first';
        option.value = '';
        albumselect.appendChild(option);
        albumselect.disabled = true;
        return;
    }

    if (!getselectedalbum()) selectedalbumid = albums[0].id;
    albums.forEach(album => {
        const option = document.createElement('option');
        option.value = album.id;

        option.textContent = album.name;
        albumselect.appendChild(option);

    });
    albumselect.disabled = false;
    albumselect.value = selectedalbumid;
}

function renderavailablesongs() {

    songlist.innerHTML = '';
    const searchTerm = albumsearch.value.trim().toLocaleLowerCase();
    const sortedTracks = playlist
        .filter(track => {
            if (!searchTerm) return true;
            return `${track.artist || ''} ${track.title || ''}`.toLocaleLowerCase().includes(searchTerm);
        })
        .sort(comparealbumtrack);
    if (sortedTracks.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'album-empty';
        empty.textContent = 'No songs available.';
        songlist.appendChild(empty);
        return;
    }

    sortedTracks.forEach((track, index) => {
        const item = document.createElement('li');
        item.className = 'album-song-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `album-song-${index}`;

        checkbox.dataset.source = track.src;
        checkbox.checked = selectedsongsource.has(track.src);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedsongsource.add(track.src);
            } else {
                selectedsongsource.delete(track.src);
            }
        });
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = track.artist ? `${track.artist} - ${track.title}` : track.title;
        const playButton = document.createElement('button');

        playButton.type = 'button';
        playButton.className = 'forum-btn-sm album-song-play';


        playButton.textContent = 'Play';
        playButton.title = 'Play this song';
        playButton.addEventListener('click', () => playalbumtrack(track.src));

        const deleteButton = document.createElement('button');

        deleteButton.type = 'button';

        deleteButton.className = 'forum-btn-sm album-song-delete album-danger-btn';
        deleteButton.textContent = 'Delete';


        deleteButton.title = 'Remove this song';
        deleteButton.addEventListener('click', () => opendeletesongdialog(track));
        item.appendChild(checkbox);
        item.appendChild(label);
        item.appendChild(playButton);
        item.appendChild(deleteButton);

        songlist.appendChild(item);
    });
}

function playalbumtrack(source, { keepAlbumQueue = false, albumSources = null } = {}) {
    if (albumSources) {
        const sourceIndex = albumSources.indexOf(source);
        albumplaybackq = sourceIndex >= 0 ? albumSources.slice(sourceIndex + 1) : null;
        currentplayingalbumsources = albumSources;
    } else if (!keepAlbumQueue) {
        albumplaybackq = null;
        currentplayingalbumsources = null;
    }
    const track = playlist.find(item => item.src === source);
    if (!track) return;
    loadtrack(track);
    loadcurrenttrackLyrics();
    initaudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audio.play().catch(error => {
        console.error('Unable to play album track..............:', error);
    });

}

function renderalbumplaylist() {

    albumplaylist.innerHTML = '';
    const album = getselectedalbum();
    selalbumtitle.textContent = album ? album.name : 'Album songs';
    playalbum.disabled = !album || album.songs.length === 0;

    renamealbum.disabled = !album;
    closealbumrenamerow();
    if (!album || album.songs.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'album-empty';
        empty.textContent = album ? 'No songs in this album yet!' : 'Select an album to see its songs <><';
        albumplaylist.appendChild(empty);
        return;
    }

    album.songs.forEach((source, index) => {
        const track = playlist.find(item => item.src === source);
        if (!track) return;
        const item = document.createElement('li');
        item.className = 'album-song-item';
        item.draggable = true;
        item.dataset.source = source;
        item.addEventListener('dragstart', event => {
            draggedalbumsource = source;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', source);

        });
        item.addEventListener('dragover', event => event.preventDefault());
        item.addEventListener('drop', event => {
            event.preventDefault();
            const fromSource = draggedalbumsource || event.dataTransfer.getData('text/plain');



            const fromIndex = album.songs.indexOf(fromSource);
            const toIndex = album.songs.indexOf(source);
            if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
            album.songs.splice(fromIndex, 1);

            album.songs.splice(toIndex, 0, fromSource);
            draggedalbumsource = null;
            savealbumstorage();
            renderalbumplaylist();
        });
        item.addEventListener('dragend', () => {
            draggedalbumsource = null;
        });

        const number = document.createElement('span');
        number.className = 'album-track-number';
        number.textContent = `${index + 1}.`;

        item.appendChild(number);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'album-track-link';
        button.textContent = track.artist ? `${track.artist} - ${track.title}` : track.title;
        button.title = 'Play this song';
        button.addEventListener('click', () => {
            const albumSources = album.songs.filter(albumSource =>
                playlist.some(albumTrack => albumTrack.src === albumSource)
            );
            playalbumtrack(source, { albumSources });
        });
        item.appendChild(button);


        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'album-remove-song';

        removeButton.textContent = '[remove]';
        removeButton.addEventListener('click', () => {
            album.songs = album.songs.filter(albumSource => albumSource !== source);
            savealbumstorage();
            renderalbumplaylist();
        });
        item.appendChild(removeButton);
        albumplaylist.appendChild(item);
    });
}

function playselectedalbum() {

    const album = getselectedalbum();
    if (!album || album.songs.length === 0) {
        albumactionstat.textContent = 'Select an album with songs first!';
        return;
    }
    const albumSources = album.songs.filter(source =>
        playlist.some(track => track.src === source)
    );
    const firstTrack = playlist.find(track => track.src === albumSources[0]);
    if (!firstTrack) {
        albumactionstat.textContent = 'This should never happen. LOL..';
        return;
    }
    albumplaybackq = albumSources.slice(1);


    currentplayingalbumsources = albumSources;
    playalbumtrack(firstTrack.src, { keepAlbumQueue: true });
}

function renderalbums() {
    renderalbumselect();
    renderavailablesongs();
    renderalbumplaylist();
}

function createalbum() {
    const name = albumnameinp.value.trim();
    if (!name) {

        albumnameinp.focus();
        return;
    }
    songlist.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedsongsource.add(checkbox.dataset.source);
    });

    if (albums.some(album => album.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        selectedalbumid = albums.find(album => album.name.toLocaleLowerCase() === name.toLocaleLowerCase()).id;
        albumnameinp.value = '';

        renderalbums();
        return;
    }
    const songstoadd = Array.from(selectedsongsource).filter(source =>
        playlist.some(track => track.src === source)
    );
    const album = {
        id: `album-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        songs: songstoadd
    };
    albums.push(album);
    selectedalbumid = album.id;
    albumnameinp.value = '';
    selectedsongsource.clear();
    savealbumstorage();
    renderalbums();
    albumactionstat.textContent = songstoadd.length > 0
        ? `Created "${album.name}" with ${songstoadd.length} song${songstoadd.length === 1 ? '' : 's'}.`

        : `Created "${album.name}".`;
}

function closealbumrenamerow() {
    albumrenamerow.classList.add('hidden');
    albumrenameinput.value = '';
}

function openalbumrenamerow() {
    const album = getselectedalbum();
    if (!album) {
        albumactionstat.textContent = 'Select an album to rename first.';
        return;
    }
    albumrenameinput.value = album.name;
    albumrenamerow.classList.remove('hidden');
    albumrenameinput.focus();

    albumrenameinput.select();
}

function savealbumrename() {
    const album = getselectedalbum();
    if (!album) {
        closealbumrenamerow();
        return;
    }
    const newName = albumrenameinput.value.trim();
    if (!newName) {
        albumrenameinput.focus();
        return;
    }
    const duplicate = albums.find(item =>
        item.id !== album.id && item.name.toLocaleLowerCase() === newName.toLocaleLowerCase()
    );
    if (duplicate) {
        albumactionstat.textContent = `An album named "${newName}" already exists silly!`;
        return;
    }
    album.name = newName;
    savealbumstorage();
    closealbumrenamerow();
    renderalbums();
    albumactionstat.textContent = `Renamed to "${newName}".`;
}

renamealbum.addEventListener('click', openalbumrenamerow);

savealbum_rename.addEventListener('click', savealbumrename);
cancelalbum_rename.addEventListener('click', closealbumrenamerow);

albumrenameinput.addEventListener('keydown', event => {
    if (event.key === 'Enter') savealbumrename();
    if (event.key === 'Escape') closealbumrenamerow();
});

function addsongs_toalbum() {
    selectedalbumid = albumselect.value || selectedalbumid;
    const album = getselectedalbum();
    if (!album) {
        albumactionstat.textContent = 'Create or select an album first!';
        return;
    }
    songlist.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedsongsource.add(checkbox.dataset.source);
    });
    if (selectedsongsource.size === 0) {
        albumactionstat.textContent = 'Select at least one song first!';
        return;
    }
    let addedCount = 0;
    selectedsongsource.forEach(source => {
        if (playlist.some(track => track.src === source) && !album.songs.includes(source)) { //and
            album.songs.push(source);
            addedCount += 1;
        }
    });
    selectedsongsource.clear();
    savealbumstorage();
    renderalbums();
    albumactionstat.textContent = `${addedCount} song${addedCount === 1 ? '' : 's'} added to ${album.name}.`;
}

function savedavatar_apply() {
    let savedAvatar = null;
    try {
        savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    } catch (err) {
        console.warn("old feature now not important. ignore", err);
    }
    if (!savedAvatar) return;
    avatarimage.forEach(image => {
        image.src = savedAvatar;
        image.style.display = 'block';
        if (image.nextElementSibling) image.nextElementSibling.style.display = 'none';
    });
}

loopalbum.addEventListener('click', () => {
    albumlooptoggle = !albumlooptoggle;
    loopalbum.classList.toggle('active', albumlooptoggle);
    loopalbum.textContent = albumlooptoggle ? 'Loop Album: On' : 'Loop Album: Off';
    localStorage.setItem('meow_album_loop', albumlooptoggle ? 'on' : 'off');
});

function savedalbumloop() {
    albumlooptoggle = localStorage.getItem('meow_album_loop') === 'on';
    loopalbum.classList.toggle('active', albumlooptoggle);
    loopalbum.textContent = albumlooptoggle ? 'Loop Album: On' : 'Loop Album: Off';
}




createalbumbutton.addEventListener('click', createalbum);
albumnameinp.addEventListener('keydown', event => {
    if (event.key === 'Enter') createalbum();
});
albumselect.addEventListener('change', () => {
    selectedalbumid = albumselect.value || null;
    selectedsongsource.clear();
    renderalbums();
});


function closedeletepopup() {
    deletepopup.style.display = 'none';
    deletepopup.setAttribute('hidden', '');
}

function deleteSelectedAlbum() {
    const album = getselectedalbum();
    if (!album) {
        closedeletepopup();
        return;
    }
    albums = albums.filter(item => item.id !== album.id);
    selectedalbumid = albums.length > 0 ? albums[0].id : null;
    selectedsongsource.clear();
    savealbumstorage();
    renderalbums();
    closedeletepopup();
}
deletealbum.addEventListener('click', () => {
    const album = getselectedalbum();
    if (!album) {
        albumactionstat.textContent = 'Select an album to delete first!';
        return;
    }
    selectedalbumid = album.id;
    deletemessage.textContent = `Are you sure you want to delete album "${album.name}"?`;
    deletepopup.removeAttribute('hidden');
    deletepopup.style.display = 'block';
    albumactionstat.textContent = 'Confirm deletion below.';
});
canceldeletealbum.addEventListener('click', closedeletepopup);
confirmdeletealbum.addEventListener('click', deleteSelectedAlbum);

function closedeletesongpopup() {
    deletesongpopup.style.display = 'none';
    deletesongpopup.setAttribute('hidden', '');
    pendingdeletesongsources = null;
}

function tracklabel(track) {
    return track.artist ? `${track.artist} - ${track.title}` : track.title;
}

function opendeletesongdialog(track) {
    const tracks = selectedsongsource.size > 1
        ? playlist.filter(item => selectedsongsource.has(item.src))
        : [track];

    pendingdeletesongsources = tracks.map(item => item.src);

    if (tracks.length > 1) {
        deletesongtitle.textContent = `Delete ${tracks.length} songs?`;
        const names = tracks.map(tracklabel);
        const preview = names.length > 5
            ? `${names.slice(0, 5).join(', ')}, and ${names.length - 5} more`
            : names.join(', ');
        deletesongmessage.textContent = `Are you sure you want to delete these ${tracks.length} selected songs? (${preview})`;
    } else {
        deletesongtitle.textContent = 'Delete song?';
        deletesongmessage.textContent = `Are you sure you want to delete "${tracklabel(tracks[0])}"? `;
    }

    deletesongpopup.removeAttribute('hidden');
    deletesongpopup.style.display = 'block';
}

async function confirmdeletesongaction() {
    const sources = pendingdeletesongsources;
    if (!sources || sources.length === 0) {
        closedeletesongpopup();
        return;
    }
    const sourceset = new Set(sources);
    playlist = playlist.filter(track => !sourceset.has(track.src));
    albums.forEach(album => {
        album.songs = album.songs.filter(albumsource => !sourceset.has(albumsource));
    });
    sources.forEach(source => selectedsongsource.delete(source));
    savealbumstorage();
    if (window.meowapi) {
        try {
            await window.meowapi.writeplaylist(playlist);
            await Promise.all(sources.map(source => window.meowapi.deletesongfile(source)));
        } catch (err) {
            console.error("Couldn't fully delete songs???????", err);
        }
    }
    renderalbums();
    closedeletesongpopup();
}

canceldeletesong.addEventListener('click', closedeletesongpopup);
confirmdeletesong.addEventListener('click', confirmdeletesongaction);
albumsort.addEventListener('change', renderavailablesongs);
albumsearch.addEventListener('input', renderavailablesongs);
playalbum.addEventListener('click', playselectedalbum);
allsongselect.addEventListener('click', () => {
    playlist.forEach(track => selectedsongsource.add(track.src));
    renderavailablesongs();
});
clearsongsbutton.addEventListener('click', () => {
    selectedsongsource.clear();
    renderavailablesongs();
});
selectionadd.addEventListener('click', addsongs_toalbum);

function getrandomtrack() {
    if (playlist.length === 0) return null;
    let candidates = playlist.filter(track => !recentlyplayed.includes(track.src));
    if (candidates.length === 0) {
        candidates = playlist;
    }
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

function spotifysearch_URL(artist) {
    return `https://open.spotify.com/search/${encodeURIComponent(artist)}`;
}

function getartist_URL(artist) {
    return artistLinks[artist] || spotifysearch_URL(artist);
}

function escapehtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function render_nowplaying(track) {
    if (!track) {
        songtitle.textContent = 'Now playing: Nothing right now!!';
        return;
    }
    if (track.artist) {
        songtitle.innerHTML = `Now playing: <a href="${getartist_URL(track.artist)}" target="_blank" rel="noopener noreferrer" class="artist-link">${escapehtml(track.artist)}</a> - ${escapehtml(track.title)}`;
    } else {
        songtitle.textContent = `Now playing: ${track.title}`;
    }
}

function applysavedtheme() {
    const savedTheme = localStorage.getItem('meow_theme') || 'light-mode';
    const body = document.body;

    if (savedTheme === 'dark-mode') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themebutton.textContent = 'Mode: Dark';
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themebutton.textContent = 'Mode: Light';
    }
}

function applysavedlyrics_state() {
    const savedLyrics = localStorage.getItem('meow_lyrics') || 'open';

    if (savedLyrics === 'closed') {
        lyricspanel.classList.add('hidden');
        lyricsbutton.classList.remove('active');
        lyricsbutton.textContent = 'Lyrics: Off';
    } else {
        lyricspanel.classList.remove('hidden');
        lyricsbutton.classList.add('active');
        lyricsbutton.textContent = 'Lyrics: On';
    }
}

function applysavedloop() {
    const savedLoop = localStorage.getItem('meow_loop') === 'on';
    audio.loop = savedLoop;
    loopbutton.classList.toggle('active', savedLoop);
    loopbutton.textContent = savedLoop ? 'Loop: On' : 'Loop: Off';
}

function applysavedvol() {
    const savedVolume = localStorage.getItem('meow_volume');
    const volume = savedVolume !== null ? parseInt(savedVolume, 10) : 50;
    audio.volume = volume / 100;
    volslider.value = volume;
    volVALUE.value = volume;
    if (volume > 0) previousvol = volume;
}

function applysavedvolpanel_state() {
    const savedState = localStorage.getItem('meow_volume_panel') || 'open';

    if (savedState === 'closed') {
        volpanel.classList.add('hidden');
        volbutton.classList.remove('active');
        volbutton.textContent = 'Volume: Off';
    } else {
        volpanel.classList.remove('hidden');
        volbutton.classList.add('active');
        volbutton.textContent = 'Volume: On';
    }

}

function applyrating() {
    const savedRating = parseFloat(localStorage.getItem('meow_rating'));
    const rating = Number.isFinite(savedRating) ? Math.min(5, Math.max(0, savedRating)) : 4.73;
    const hasVoted = localStorage.getItem('meow_rating_voted') === 'true';

    const formattedRating = rating.toFixed(2);
    ratingval.textContent = formattedRating;
    tworatingvalue.forEach(value => {
        value.textContent = formattedRating;
    });
    userratingbut.forEach(button => {
        button.disabled = hasVoted;
    });
}

function castratingvote(change) {
    if (localStorage.getItem('meow_rating_voted') === 'true') return;

    const currentRating = parseFloat(ratingval.textContent);
    const rating = Math.min(5, Math.max(0, currentRating + change));
    localStorage.setItem('meow_rating_voted', 'true');
    ratingval.textContent = 'Calculating...';
    tworatingvalue.forEach(value => {
        value.textContent = 'Calculating...';
    });
    userratingbut.forEach(button => {
        button.disabled = true;
    });

    const delay = Math.floor(Math.random() * 900) + 50;
    window.setTimeout(() => {
        localStorage.setItem('meow_rating', rating.toFixed(2));
        const formattedRating = rating.toFixed(2);
        ratingval.textContent = formattedRating;
        tworatingvalue.forEach(value => {
            value.textContent = formattedRating;
        });
    }, delay);
}

ratingupbutton.addEventListener('click', () => castratingvote(0.01));
ratingdownbutton.addEventListener('click', () => castratingvote(-0.01));
document.querySelectorAll('.reply-post .rating-vote-btn')[0].addEventListener('click', () => castratingvote(0.01));
document.querySelectorAll('.reply-post .rating-vote-btn')[1].addEventListener('click', () => castratingvote(-0.01));

function applysavedthread_rating() {
    const ratingVersion = '765';
    if (localStorage.getItem('meow_thread_rating_version') !== ratingVersion) {
        localStorage.setItem('meow_thread_rating', ratingVersion);
        localStorage.removeItem('meow_thread_rating_voted');
        localStorage.setItem('meow_thread_rating_version', ratingVersion);
    }

    const savedRating = parseInt(localStorage.getItem('meow_thread_rating'), 10);
    const rating = Number.isFinite(savedRating) ? savedRating : 765;
    const hasVoted = localStorage.getItem('meow_thread_rating_voted') === 'true';

    threadratingval.textContent = rating.toString();
    threadup.disabled = hasVoted;
    threaddown.disabled = hasVoted;
}

function castthreadratingvote(change) {
    if (localStorage.getItem('meow_thread_rating_voted') === 'true') return;

    const currentRating = parseInt(threadratingval.textContent, 10) || 0;
    localStorage.setItem('meow_thread_rating', (currentRating + change).toString());
    localStorage.setItem('meow_thread_rating_voted', 'true');
    applysavedthread_rating();
}

threadup.addEventListener('click', () => castthreadratingvote(1));
threaddown.addEventListener('click', () => castthreadratingvote(-1));

function themetoggle() {
    const body = document.body;
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        
        body.classList.add('dark-mode');
        themebutton.textContent = 'Mode: Dark';

        localStorage.setItem('meow_theme', 'dark-mode');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themebutton.textContent = 'Mode: Light';

        localStorage.setItem('meow_theme', 'light-mode');
    }
}

themebutton.addEventListener('click', themetoggle);

function resizecanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

window.addEventListener('resize', resizecanvas);

function initaudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const splitter = audioCtx.createChannelSplitter(2);
    leftAnalyser = audioCtx.createAnalyser();
    rightAnalyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);


    const bassCut = audioCtx.createBiquadFilter();


    bassCut.type = 'lowshelf';
    bassCut.frequency.value = 250;
    bassCut.gain.value = -12;

    const trebleBoost = audioCtx.createBiquadFilter();
    trebleBoost.type = 'highshelf';
    trebleBoost.frequency.value = 3000;

    trebleBoost.gain.value = 4;

    source.connect(bassCut);
    bassCut.connect(trebleBoost);
    trebleBoost.connect(splitter);

    splitter.connect(leftAnalyser, 0);
    splitter.connect(rightAnalyser, 1);
    trebleBoost.connect(audioCtx.destination);
    leftAnalyser.fftSize = 2048;

    rightAnalyser.fftSize = 2048;
    
    canvas = document.getElementById('visualizer');
    canvasCtx = canvas.getContext('2d');
    
    resizecanvas();
    leftDataArray = new Uint8Array(leftAnalyser.fftSize);
    rightDataArray = new Uint8Array(rightAnalyser.fftSize);
    draw_visualiser();
}

function draw_visualiser() {
    requestAnimationFrame(draw_visualiser);
    if (!leftAnalyser || !rightAnalyser) return;


    const computedstyle = getComputedStyle(document.body);
    const barcolour = computedstyle.getPropertyValue('--canvas-bar').trim();

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    canvasCtx.strokeStyle = barcolour;
    canvasCtx.lineWidth = 2;

    const channelHeight = canvas.height / 2;

    canvasCtx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();

    canvasCtx.moveTo(0, channelHeight);
    canvasCtx.lineTo(canvas.width, channelHeight);

    canvasCtx.stroke();

    const channels = [
        { analyser: leftAnalyser, data: leftDataArray, color: barcolour },
        { analyser: rightAnalyser, data: rightDataArray, color: '#60a5fa' }
    ];
    channels.forEach((channelData, channel) => {
        channelData.analyser.getByteTimeDomainData(channelData.data);


        const centerY = channelHeight * channel + channelHeight / 2;
        canvasCtx.strokeStyle = channelData.color;
        canvasCtx.beginPath();


        for (let i = 0; i < channelData.data.length; i++) {
            const x = (i / (channelData.data.length - 1)) * canvas.width;
            const amplitude = (channelData.data[i] - 128) / 128;
            const y = centerY + amplitude * channelHeight * 0.9;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }

        canvasCtx.stroke();
    });

    canvasCtx.font = 'bold 10px monospace';
    canvasCtx.fillStyle = getComputedStyle(document.body)
        .getPropertyValue('--channel-label').trim();
    canvasCtx.fillText('L', 6, 14);
    canvasCtx.fillText('R', 6, channelHeight + 14);
}

function parseLRC(lrc) {
    const lines = [];

    const lineRe = /\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)/;
    lrc.split('\n').forEach(rawLine => {
        const match = rawLine.match(lineRe);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);

            const text = match[3].trim();
            if (text) lines.push({ time: minutes * 60 + seconds, text });
        }
    });
    return lines.length ? lines : null;
}

function renderplainlyrics(text) {
    lyricstxt.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = text;
    lyricstxt.appendChild(p);
}

function rendersyncedlyrics_OLD(lines) {
    lyricstxt.innerHTML = '';
    lines.forEach(line => {
        const row = document.createElement('div');
        row.className = 'lyric-line';

        const text = document.createElement('span');
        text.className = 'lyric-text';
        text.textContent = line.text;


        row.appendChild(text);
        lyricstxt.appendChild(row);
    });
}

async function getlyrics(track) {
    lyricstxt.innerHTML = '';

    if (!track.artist) {
        renderplainlyrics(track.lyrics || "This should never happen...");
        return;
    }

    const params = new URLSearchParams({
        track_name: track.title,
        artist_name: track.artist
    });

    try {
        const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);

        if (res.ok) {
            const data = await res.json();
            if (data.syncedLyrics) {
                const parsed = parseLRC(data.syncedLyrics);
                if (parsed) {
                    rendersyncedlyrics_OLD(parsed);
                    return;
                }
            }
            if (data.plainLyrics) {
                renderplainlyrics(data.plainLyrics);
                return;
            }
        }

        

        
        const searchres = await fetch(`https://lrclib.net/api/search?${params.toString()}`);
        if (searchres.ok) {
            const results = await searchres.json();
            if (results.length > 0) {
                if (results[0].syncedLyrics) {
                    const parsed = parseLRC(results[0].syncedLyrics);
                    if (parsed) {
                        rendersyncedlyrics_OLD(parsed);
                        return;
                    }
                }
                if (results[0].plainLyrics) {
                    renderplainlyrics(results[0].plainLyrics);
                    return;
                }
            }
        }

   
        renderplainlyrics(track.lyrics || "Either no lyrics found, or no internet connection to grab lyrics");
    } catch (err) {
        console.error("Lyrics fetch failed:", err);
        renderplainlyrics(track.lyrics || "Couldn't load lyrics (network error)");
    }
}

function loadtrack(track, { recordHistory = true } = {}) {
    currenttrack = track;
    lyricstrack = null;
    audio.src = resolvetracksrc(track.src);
    lastaudiotime = null;
    replaystartinput.value = '00:00';
    replayendinput.value = '00:00';

    replayrangeactive = false;
    if (recordHistory) {
        recordplayed(track);
        addtohistory(track);
        recordtrackstats(track);
    }
    const extension = track.src.split('.').pop().toLowerCase();
    const codecnames = {
        mp3: 'MP3',
        aac: 'AAC',
        m4a: 'M4A',
        flac: 'FLAC',
        wav: 'WAV',
        ogg: 'OGG'
    };
    const mitypes = {
        flac: 'audio/flac',
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        wav: 'audio/wav',
        ogg: 'audio/ogg'
    };
    audio.setAttribute('type', mitypes[extension] || 'audio/*');
    codecdisplay.textContent = `Codec: ${codecnames[extension] || extension.toUpperCase()}`;
    render_nowplaying(track);
    timedisplay.textContent = '00:00';
    durationdisplay.textContent = '00:00';
    seekbar.value = 0;
    renderplainlyrics("Lyrics can't load if your not playing anything <>< !");
}

function loadcurrenttrackLyrics() {
    if (currenttrack && lyricstrack !== currenttrack) {
        lyricstrack = currenttrack;
        getlyrics(currenttrack);
    }
}







function togglelyricsPAN() {
    const isHidden = lyricspanel.classList.toggle('hidden');
    lyricsbutton.classList.toggle('active', !isHidden);
    lyricsbutton.textContent = isHidden ? 'Lyrics: Off' : 'Lyrics: On';
    
    localStorage.setItem('meow_lyrics', isHidden ? 'closed' : 'open');
    updatesidebar_layout();
    
    setTimeout(resizecanvas, 50); 
}

lyricsbutton.addEventListener('click', togglelyricsPAN);
closelyricsbutton.addEventListener('click', togglelyricsPAN);

document.getElementById('btn-play').addEventListener('click', () => {
    if (!startedplayback) {
        const randomTrack = getrandomtrack();
        if (!randomTrack) return;
        loadtrack(randomTrack);
        loadcurrenttrackLyrics();
    }
    initaudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (currenttrack) {
        render_nowplaying(currenttrack);
        loadcurrenttrackLyrics();
    }
    audio.play().catch(error => {
        console.error("play() rejected:", error);
        songtitle.textContent = `Couldn't play: ${error.message || error}`;
    });
});





document.getElementById('btn-pause').addEventListener('click', () => {
    audio.pause();
});

restartbutton.addEventListener('click', () => {
    audio.currentTime = 0;
    initaudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (currenttrack) {
        render_nowplaying(currenttrack);
        loadcurrenttrackLyrics();
    }
    audio.play().catch(error => {
        console.error("play() rejected (restart):", error);
    });
});

function parsereplaytime(value) {
    const parts = value.trim().split(':').map(Number);
    if (parts.length === 2 && parts.every(Number.isFinite)) {
        return Math.max(0, parts[0] * 60 + parts[1]);
    }
    if (parts.length === 1 && Number.isFinite(parts[0])) {
        return Math.max(0, parts[0]);
    }
    return null;
}

function updatereplayrange() {
    const start = parsereplaytime(replaystartinput.value);
    const end = parsereplaytime(replayendinput.value);
    if (start === null || end === null || end <= start) {
        replayrangeactive = false;
        return;
    }
    replaystart = start;
    replayend = end;
    replayrangeactive = true;
    if (audio.currentTime < replaystart || audio.currentTime >= replayend) {
        audio.currentTime = replaystart;
    }
}

replaybutton.addEventListener('click', () => {
    const isOpen = !replaymenu.classList.toggle('hidden');
    replaybutton.classList.toggle('active', isOpen);
    replayrangeactive = isOpen;
    if (isOpen) {
        updatereplayrange();
    } else {
        replayrangeactive = false;
    }
});

[replaystartinput, replayendinput].forEach(input => {
    input.addEventListener('change', updatereplayrange);
});

document.getElementById('btn-shuffle').addEventListener('click', () => {
    const nextTrack = getrandomtrack();
    if (!nextTrack) return;
    loadtrack(nextTrack);
    loadcurrenttrackLyrics();
    initaudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audio.play().catch(error => {
        console.error("play() rejected (shuffle):", error);
    });
});



loopbutton.addEventListener('click', () => {
    audio.loop = !audio.loop;
    loopbutton.classList.toggle('active', audio.loop);
    loopbutton.textContent = audio.loop ? 'Loop: On' : 'Loop: Off';
    localStorage.setItem('meow_loop', audio.loop ? 'on' : 'off');
});






function togglevolpanel() {
    const isHidden = volpanel.classList.toggle('hidden');
    volbutton.classList.toggle('active', !isHidden);
    volbutton.textContent = isHidden ? 'Volume: Off' : 'Volume: On';
    localStorage.setItem('meow_volume_panel', isHidden ? 'closed' : 'open');
    updatesidebar_layout();
    setTimeout(resizecanvas, 50);
}

volbutton.addEventListener('click', togglevolpanel);
closevolbutton.addEventListener('click', togglevolpanel);

function updatesidebar_layout() {
    postlayout.classList.toggle(
        'lyrics-closed',
        lyricspanel.classList.contains('hidden')
    );
}

function toggleattachment(panel, storageKey) {
    const isHidden = panel.classList.toggle('hidden');
    localStorage.setItem(storageKey, isHidden ? 'closed' : 'open');
    updateAttachmentToggleState();
    updateattachmentlayout();
}

function apply_savedattachstate(panel, storageKey) {
    if (localStorage.getItem(storageKey) === 'closed') {
        panel.classList.add('hidden');
    }
}

function togglealbumattachment() {
    const isHidden = albumpanel.classList.toggle('hidden');
    localStorage.setItem('meow_album_panel', isHidden ? 'closed' : 'open');
    updatealbumtoggle();
}

function apply_albumattachment_state() {
    if (localStorage.getItem('meow_album_panel') === 'closed') {
        albumpanel.classList.add('hidden');
    }
    updatealbumtoggle();
}

function updatealbumtoggle() {
    const isHidden = albumpanel.classList.contains('hidden');
    albumsbutton.classList.toggle('active', !isHidden);
    albumsbutton.textContent = isHidden ? 'Albums: Off' : 'Albums: On';
}

closehisbutton.addEventListener('click', () => toggleattachment(historypanel, 'meow_history_panel'));
closestatsbutton.addEventListener('click', () => toggleattachment(statspanel, 'meow_stats_panel'));
closealbumbutton.addEventListener('click', togglealbumattachment);
albumsbutton.addEventListener('click', togglealbumattachment);

function updatehistorytoggle() {
    const isHidden = historypanel.classList.contains('hidden');
    historybutton.classList.toggle('active', !isHidden);
    historybutton.textContent = isHidden ? 'History: Off' : 'History: On';
}

function updatestatstoggle() {
    const isHidden = statspanel.classList.contains('hidden');
    statsbutton.classList.toggle('active', !isHidden);
    statsbutton.textContent = isHidden ? 'Stats: Off' : 'Stats: On';
}

function updateAttachmentToggleState() {
    updatehistorytoggle();
    updatestatstoggle();
    updatealbumtoggle();
}

function updateattachmentlayout() {
    const firstPost = document.querySelector('.post-layout > .post-body');
    if (firstPost) {
        firstPost.classList.toggle(
            'attachments-empty',
            historypanel.classList.contains('hidden') &&
            statspanel.classList.contains('hidden')
        );
    }
}

historybutton.addEventListener('click', () => toggleattachment(historypanel, 'meow_history_panel'));
statsbutton.addEventListener('click', () => toggleattachment(statspanel, 'meow_stats_panel'));





volslider.addEventListener('input', () => {
    const value = parseInt(volslider.value, 10);
    setvolpercent(value);
});

function setvolpercent(value) {
    const clampval = Math.max(0, Math.min(100, value));
    audio.volume = clampval / 100;
    volslider.value = clampval;
    volVALUE.value = clampval;
    localStorage.setItem('meow_volume', clampval);
    if (clampval > 0) previousvol = clampval;
}

volVALUE.addEventListener('change', () => {
    const value = Number(volVALUE.value);
    if (!Number.isFinite(value)) {
        volVALUE.value = Math.round(audio.volume * 100);
        return;
    }
    setvolpercent(value);
});

document.addEventListener('keydown', event => {
    const target = event.target;
    const isPlaybackSlider = target === seekbar || target === volslider;
    if (!isPlaybackSlider && (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
    )) {
        return;
    }

    const key = event.key.toLowerCase();
    const seekStep = event.altKey ? 10 : 5;
    const volumeStep = event.shiftKey ? 1 : event.altKey ? 10 : 5;

    if (key === 't' && !event.shiftKey) {
        event.preventDefault();
        themebutton.click();
        return;
    }

    if (key === 'p' && event.shiftKey) {
        event.preventDefault();
        playalbum.click();
        return;
    }

    if (key === 'd' && event.shiftKey) {
        event.preventDefault();
        deletealbum.click();
        return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        if (isFinite(audio.duration) && audio.duration > 0) {
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + direction * seekStep));
        }
        return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? 1 : -1;
        const currentVolume = Math.round(audio.volume * 100);
        setvolpercent(currentVolume + direction * volumeStep);
        return;
    }

    if (key === 'r') {
        event.preventDefault();
        if (event.shiftKey) {
            document.getElementById('btn-shuffle').click();
        } else {
            restartbutton.click();
        }
        return;
    }

    if (key === 'l' && event.shiftKey) {
        event.preventDefault();
        loopbutton.click();
        return;
    }

    if (event.key === 'Enter' || key === 'p') {
        event.preventDefault();
        if (audio.paused) {
            document.getElementById('btn-play').click();
        } else {
            audio.pause();
        }
        return;
    }

    if (key === 'm') {
        event.preventDefault();
        const currentVolume = Math.round(audio.volume * 100);
        if (currentVolume === 0) {
            setvolpercent(previousvol || 100);
        } else {
            previousvol = currentVolume;
            setvolpercent(0);
        }
        return;
    }

    if (key === 'x') {
        event.preventDefault();
        replaybutton.click();
        return;
    }

    if (key === 'a') {
        event.preventDefault();
        albumsbutton.click();
        return;
    }

    if (key === 'l') {
        event.preventDefault();
        lyricsbutton.click();
        return;
    }

    if (key === 'h') {
        event.preventDefault();
        historybutton.click();
        return;
    }

    if (key === 'v') {
        event.preventDefault();
        volbutton.click();
        return;
    }

    if (key === 's') {
        event.preventDefault();
        statsbutton.click();
    }
});

function formatetime(seconds) {
    if (!isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

audio.addEventListener('loadedmetadata', () => {
    durationdisplay.textContent = formatetime(audio.duration);
    seekbar.max = audio.duration || 0;
    seekbar.value = 0;
});

audio.addEventListener('timeupdate', () => {
    timedisplay.textContent = formatetime(audio.currentTime);
    if (replayrangeactive && audio.currentTime >= replayend) {
        audio.currentTime = replaystart;
    }
    if (!audio.paused && lastaudiotime !== null) {
        const elapsed = audio.currentTime - lastaudiotime;
        if (elapsed > 0 && elapsed <= 2) {
            listeningstats.totalseconds += elapsed;
            savestatsstorage();
            renderstats();
        }
    }
    lastaudiotime = audio.currentTime;
    if (isFinite(audio.duration) && audio.duration > 0) {
        seekbar.value = audio.currentTime;
    }
});

function updatediscordpresence() {
    if (!window.meowapi) return;
    if (!currenttrack || audio.paused) {
        window.meowapi.clearpresence();
        return;
    }
    window.meowapi.updatepresence({
        title: currenttrack.title,
        artist: currenttrack.artist || '',
        position: audio.currentTime || 0
    });
}

audio.addEventListener('play', () => {
    startedplayback = true;
    lastaudiotime = audio.currentTime;
    updatediscordpresence();
});

audio.addEventListener('pause', () => {
    lastaudiotime = null;
    updatediscordpresence();
});

audio.addEventListener('error', () => {
    console.error('cant happen:', audio.src);
    songtitle.textContent = 'cant happen';
});

seekbar.addEventListener('input', () => {
    if (isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = seekbar.valueAsNumber;
    }
});

audio.addEventListener('ended', () => {
    if (audio.loop) {
        recordtrackstats(currenttrack);
        lastaudiotime = 0;
        return;
    }
    if (playlist.length === 0) return;

    if (albumplaybackq && albumplaybackq.length > 0) {
        const nextAlbumSource = albumplaybackq.shift();
        playalbumtrack(nextAlbumSource, { keepAlbumQueue: true });
        return;
    }

    if (albumlooptoggle && currentplayingalbumsources && currentplayingalbumsources.length > 0) {
        const validSources = currentplayingalbumsources.filter(source =>
            playlist.some(track => track.src === source)
        );
        if (validSources.length > 0) {
            albumplaybackq = validSources.slice(1);
            playalbumtrack(validSources[0], { keepAlbumQueue: true });
            return;
        }
    }

    albumplaybackq = null;
    currentplayingalbumsources = null;

    const nextTrack = getrandomtrack();
    if (!nextTrack) return;
    loadtrack(nextTrack);
    loadcurrenttrackLyrics();
    audio.play().catch(error => {
        console.error('cant happen', error);
    });
});

(async function init() {
    await Promise.all([loadPlaylist(), loadArtistLinks()]);
    playhistory = loadhistorystorage();
    listeningstats = loadstatsstorage();
    albums = loadalbumstorage();
    if (albums.length > 0) selectedalbumid = albums[0].id;
    renderalbums();
    savedavatar_apply();
    renderhistory();
    renderstats();
    if (playlist.length > 0) {
        loadtrack(playlist[0], { recordHistory: false });
        songtitle.textContent = 'Now playing: Nothing right now!!';
    }
    applysavedtheme();
    applysavedlyrics_state();
    applysavedloop();
    applysavedvol();
    applysavedvolpanel_state();
    apply_savedattachstate(historypanel, 'meow_history_panel');
    apply_savedattachstate(statspanel, 'meow_stats_panel');
    apply_albumattachment_state();
    savedalbumloop();
    updateAttachmentToggleState();
    updateattachmentlayout();
    applyrating();
    applysavedthread_rating();
    updatesidebar_layout();
})();