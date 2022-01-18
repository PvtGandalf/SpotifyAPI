const { ObjectId } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');

const { SongSchema, saveSongFile } = require('../models/songs');

const {
    addPlaylist,
    removePlaylist
} = require('../models/users');
/*
* Schema for a Playlist
*/
const PlaylistSchema = {
    name: { required: true },
    owner: { required: false },
    songs: { required: false },
    numberSongs: { required: false }
};

const AddSongSchema = {
    songID: { required: true }
};

exports.SongSchema = SongSchema;
exports.AddSongSchema = AddSongSchema;
exports.PlaylistSchema = PlaylistSchema;


/*
* Create a Playlist
*/
async function createPlaylist(playlist) {
    const db = getDBReference();
    const collection = db.collection('playlists');
    const playlistToCreate = extractValidFields(playlist, PlaylistSchema);
    console.log("  -- Playlist to create:", playlistToCreate);

    const result1 = await collection.insertOne(playlistToCreate);

    const result2 = await addPlaylist(playlist.owner, playlistToCreate);

    return result1.insertedId;
}
exports.createPlaylist = createPlaylist

/*
* like a Playlist
*/
async function likePlaylist(id, playlist) {
    //const playlistToCreate = extractValidFields(playlist, PlaylistSchema);
    const playlistToCreate = await getPlaylistInfoByID(playlist);
    console.log("  -- Playlist to add to library:", playlistToCreate);

    const result = await addPlaylist(id, playlistToCreate);
    return result;
}
exports.likePlaylist = likePlaylist

/*
* unlike a Playlist
*/
async function unlikePlaylist(id, playlist) {
    //const playlistToCreate = extractValidFields(playlist, PlaylistSchema);
    console.log("  -- Playlist to remove from library:", playlist);

    const result = await removePlaylist(id, playlist);
    return result;
}
exports.unlikePlaylist = unlikePlaylist

async function getPlaylist(id) {
    const db = getDBReference();
    const collection = db.collection('playlists');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ _id: new ObjectId(id) })
            .toArray();
        return results[0];
    }
}

async function getPlaylistInfoByID(id, page) {
    console.log("==Playlist info function called, playlist ID = ", id);
    playlist = await getPlaylist(id);
    if (playlist) {
        
        try{
            count = playlist.songs.length
        } catch {
            count = 0;
        }
        console.log("count: ", count);

        /*
       * Compute last page number and make sure page is within allowed bounds.
       * Compute offset into collection.
       */
        const pageSize = 5;
        const lastPage = Math.ceil(count / pageSize);
        page = page > lastPage ? lastPage : page;
        page = page < 1 ? 1 : page;
        const offset = (page - 1) * pageSize;
        end = count;

        //console.log(offset, pageSize);
        if (offset+pageSize < count) {
            end = offset+pageSize;
        }
        try{
            playlist.songs = playlist.songs.slice(offset, end);
        } catch{
            playlist.songs = [];
        }

        return {
            playlist: playlist,
            page: page,
            totalPages: lastPage,
            pageSize: pageSize,
            count: count,
            name: playlist.name,
            _id: playlist._id,
            owner: playlist.owner
        };
    } else {
        return playlist;
    }
}
exports.getPlaylistInfoByID = getPlaylistInfoByID

/*
* Add a new song to the playlist
*/
async function insertSongIntoPlaylist(playlistID, song) {
    console.log("SONG OBJECT:", song)
    const db = getDBReference();
    const collection = db.collection('playlists');
    const songToInsert = extractValidFields(song.metadata, SongSchema);
    songToInsert.songID = song._id
    const result = await collection.updateOne(
        { _id: new ObjectId(playlistID) },
        { $push: { "songs": songToInsert } }
    )
    return result.matchedCount > 0;
}
exports.insertSongIntoPlaylist = insertSongIntoPlaylist;


/*
* Delete an entire playlist
*/
async function deletePlaylistById(playlistID) {
    const db = getDBReference();
    const collection = db.collection('playlists');
    const result = await collection.deleteOne({ _id: ObjectId(playlistID) });
    return result;
}
exports.deletePlaylistById = deletePlaylistById;


/*
* Delete a song from the playlist
*/
async function deleteSongFromPlaylistById(playlistID, songID) {
    const db = getDBReference();
    const collection = db.collection('playlists');
    const result = await collection.updateOne(
        { _id: new ObjectId(playlistID) },
        { $pull: { "songs": { "songID": ObjectId(songID) } } }
    );
    return result;
}
exports.deleteSongFromPlaylistById = deleteSongFromPlaylistById;
