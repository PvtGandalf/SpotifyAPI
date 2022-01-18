const { ObjectId, GridFSBucket } = require('mongodb');
const { getDBReference } = require('../lib/mongo');
const { extractValidFields } = require('../lib/validation');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const crypto = require('crypto');


/*
* Schema for a Song
*/
const SongSchema = {
    songID: {required: true},
    song: { required: true },
    name: { required: true },
    album: { required: true },
    artist: { required: true },
    streams: { required: false }
};
exports.SongSchema = SongSchema;

/*
* Add a new song
*/
async function saveSongFile (song) {
  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'songs' });
    const metadata = {
      contentType: song.contentType,
      name: song.name,
      album: song.album,
      artist: song.artist,
      streams: song.streams
    };
    const uploadStream = bucket.openUploadStream(
      song.filename,
      { metadata: metadata }
    );
    fs.createReadStream(song.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });

  });
};
exports.saveSongFile = saveSongFile;

/*
* Get info for a song by song id
*/
async function getSongInfoById (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'songs' });

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
      console.log(results[0]);
    return results[0];
  }
};
exports.getSongInfoById = getSongInfoById;

/*
* Get song download by song filename
*/
exports.getSongDownloadStreamByFilename = function(filename) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'songs' });
  return bucket.openDownloadStreamByName(filename);
};

/*
* Get song download by song id
*/
exports.getSongDownloadStreamById = function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'songs' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};

/*
* Get song stream by song id
*/
exports.getSongStreamById = function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'songs' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};