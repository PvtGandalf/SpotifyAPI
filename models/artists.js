const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');

const { extractValidFields } = require('../lib/validation');

const bcrypt = require('bcryptjs');

const {
    addArtist,
    removeArtist
} = require('../models/users');

/*
* Schema for an Artist
*/
const ArtistSchema = {
    name: { required: true },
    bio: { required: true },
    monthlyListeners: { required: true },
    followers: { required: false }
};
exports.ArtistSchema = ArtistSchema;

/*
* Add a new artist
*/
async function insertNewArtist(artist) {
    const db = getDBReference();
    const collection = db.collection('artists');
    const artistToInsert = extractValidFields(artist, ArtistSchema);
    
    console.log("=== artistToInsert", artistToInsert);
    
    const result = await collection.insertOne(artistToInsert);
    console.log("result.insertId:", result.insertedId);
    return result.insertedId;
}
exports.insertNewArtist = insertNewArtist;

/*
* Add a new artist
*/
async function updateArtist(artist, artistID) {
    const db = getDBReference();
    const collection = db.collection('artists');
    const artistToUpdate = extractValidFields(artist, ArtistSchema);
    
    console.log("=== artistToUpdate", artistToUpdate);
    
    const result = await collection.replaceOne( { _id : ObjectId(artistID) }, artistToUpdate );
    console.log("result.insertId:", result.insertedId);
    return result.insertedId;
}
exports.updateArtist = updateArtist;

/*
* like an artist
*/
async function likeArtist(id, artist){
    //const playlistToCreate = extractValidFields(playlist, PlaylistSchema);
    const completeArtist = await getArtistById(artist);
    console.log("  -- Playlist to add to library:", completeArtist);
    
    const result = await addArtist(id, completeArtist);
    return result;
}
exports.likeArtist = likeArtist

/*
* unlike a Playlist
*/
async function unlikeArtist(id, artist){
    //const playlistToCreate = extractValidFields(playlist, PlaylistSchema);
    console.log("  -- Playlist to remove from library:", artist);
    
    const result = await removeArtist(id, artist);
    return result;
}
exports.unlikeArtist = unlikeArtist

/*
* Delete an artist
*/
async function deleteArtistById(artistID) {
    const db = getDBReference();
    const collection = db.collection('artists');
    const result = await collection.deleteOne( { _id : ObjectId(artistID) } );
    return result;
}
exports.deleteArtistById = deleteArtistById;

/*
* Fetch an Artist from the Mongo DB based on artist ID
*/
async function getArtistById(id) {
    const db = getDBReference();
    const collection = db.collection('artists');

    const result = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();

    if (result.length == 0){
        return null;
    } else {
        return {
            "id": result[0]._id,
            "name": result[0].name,
            "bio": result[0].bio,
            "monthlyListeners": result[0].monthlyListeners,
            "followers": result[0].followers
        };
    } 
}
exports.getArtistById = getArtistById;