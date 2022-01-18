const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs/promises');

const { validateAgainstSchema } = require('../lib/validation');

const { 
    checkAdmin,
    checkAdminSignedin
  } = require('../lib/auth');

const {
    SongSchema,
    saveSongFile,
    getSongInfoById,
    getSongDownloadStreamByFilename,
    getSongDownloadStreamById,
    getSongStreamById
} = require('../models/songs');


const acceptedFileTypes = {
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mpeg'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = acceptedFileTypes[file.mimetype];
      console.log("=== extension: ", extension);
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
        console.log("=== file", file);
    callback(null, !!acceptedFileTypes[file.mimetype])
  }
});

router.get('/', (req, res, next) => {
  res.status(200).sendFile(__dirname + '/index.html');
});

/*
 * Route to create a new song.
 */
/*function uploadSong() {
  upload.single('song');
  const song = {
    path: req.file.path,
    filename: req.file.filename,
    contentType: req.file.mimetype,
    name: req.body.name,
    album: req.body.album,
    artist: req.body.artist
  };
  return song;
}
exports.uploadSong = uploadSong;*/

/*
 * Route to create a new song.
 */
router.post('/', upload.single('song'), async (req, res, next) => {
  if (req.file && req.body) {
    try {
      const song = {
        path: req.file.path,
        filename: req.file.filename,
        contentType: req.file.mimetype,
        name: req.body.name,
        album: req.body.album,
        artist: req.body.artist
      };
      const id = await saveSongFile(song);
      await fs.unlink(req.file.path);

      res.status(200).send({ id: id });
    } catch (err) {
      next(err);
    }
  } else {
      console.log("=== req.file: ", req.file);
      console.log("=== req.body: ", req.body);
    res.status(400).send({
      err: "Request body was invalid."
    });
  }
});

/*
 * Route to fetch info about a specific song.
 */
router.get('/:id', async (req, res, next) => {
  try {
    console.log("id: ", req.params.id)
    const song = await getSongInfoById(req.params.id);
    if (song) {
      const responseBody = {
        _id: song._id,
        filename: song.filename,
        url: `/media/songs/${song.filename}`,
        contentType: song.metadata.contentType,
        name: song.metadata.name,
        album: song.metadata.album,
        artist: song.metadata.artist
      };
      res.status(200).send(responseBody);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

/*
 * Route to fetch song download.
 */
router.get('/media/:filename', async (req, res, next) => {
  
  // Split the filename into individual parts for parcing
  const id = req.params.filename.split(/[-,.]+/);
  try {
    // Get the song info for the song being requested
    const songInfo = await getSongInfoById(id[0]);
  
  downloadID = songInfo._id;
  
  getSongDownloadStreamById(downloadID)
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    })
    .pipe(res);
  } catch (err) {
    next(err);
  }
});

/*
 * Route to fetch song stream.
 */
// Example: http://localhost:8000/songs/<InsertSongIdHere>/stream
router.get('/:id/stream', async (req, res, next) => {
  try {
    const song = await getSongInfoById(req.params.id);
    if (song) {
      res.set('content-type', song.metadata.contentType);
      res.set('accept-ranges', 'bytes');

      console.log("song", song);

      let songStream = getSongStreamById(song._id);
      
      songStream.on('data', (chunk) => {
        res.write(chunk);
      });

    } else {
        console.log("=== Checkpoint");
      next();
    }
  } catch (err) {
    next(err);
  }
});

router.use('*', (err, req, res, next) => {
  console.error(err);
  res.status(500).send({
    error: "An error occurred.  Try again later."
  });
});

router.use('*', (req, res, next) => {
  res.status(404).send({
    err: "Path " + req.originalUrl + " does not exist"
  });
});

module.exports = router;