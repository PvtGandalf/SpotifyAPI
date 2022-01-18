const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');

const { uploadSong } = require('./songs');
const { 
  checkAdmin,
  requireAuthentication
} = require('../lib/auth');

const {
  PlaylistSchema,
  AddSongSchema,
  SongSchema,
  createPlaylist,
  insertSongIntoPlaylist,
  getPlaylistInfoByID,
  deleteSongFromPlaylistById,
  deletePlaylistById,
  likePlaylist,
  unlikePlaylist
} = require('../models/playlists');
const { getSongInfoById } = require('../models/songs');

/*
* Create a playlist
*/
router.post('/', requireAuthentication, async (req, res) => {
  if (validateAgainstSchema(req.body, PlaylistSchema)) {
      try {
        playlist = req.body
        if(req.user && !playlist.owner){
          playlist.owner = req.user
        }
        const id = await createPlaylist(playlist);
        res.status(201).send({
          id: id
        });
      } catch (err) {
        console.log(err)
      }
  } else {
    res.status(400).send({
      error: "Request body is not a valid playlist object."
    });
  }
});


/*
* Add a song entity to a playlist
*/
router.post('/:playlistID', requireAuthentication, checkAdmin, async (req, res) => {
  if (validateAgainstSchema(req.body, AddSongSchema)) {
    try {
      const playlist = await getPlaylistInfoByID(req.params.playlistID);
      if (req.user != playlist.owner && req.checkAdmin == 0) {
        res.status(403).send({
          error: "Unauthorized to add a song to the playlist: " 
        });
      } else {
        songID = req.body.songID;
        song = await getSongInfoById(req.body.songID)
        if(song){
            song.songID = songID
          entryinfo = await insertSongIntoPlaylist(req.params.playlistID, song)
          res.status(201).send({
            Entry: "Song added to playlist " + req.params.playlistID
          })
        }
        else{
          res.status(404).send({
            error: "Song doesn't exist in database"
          })
        }
      }
    } catch (err) {
      console.log(err)
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid song ID."
    });
  }
});

/*
* Remove a song from the playlist
*/
router.delete('/:playlistID/:songID', requireAuthentication, checkAdmin, async (req, res, next) => {
    try {
      const playlist = await getPlaylistInfoByID(req.params.playlistID);
      if (req.user != playlist.owner && req.checkAdmin == 0) {
        res.status(403).send({
          error: "Unauthorized to edit this playlist: " 
        });
      } else{
        const deleteSuccessful = await deleteSongFromPlaylistById(req.params.playlistID, req.params.songID);
        if (deleteSuccessful) {
          res.status(200).end();
        } else {
          next();
        }
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete song. Please try again later."
      });
    }
  });


/*
* Get playlist info
*/
router.get('/:playlistID', async (req, res, next) => {
  try{
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const playlistPage = await getPlaylistInfoByID(req.params.playlistID, req.query.page || 1);
    playlistPage.links = {};
    if (playlistPage) {
      if (playlistPage.page < playlistPage.totalPages) {
        playlistPage.links.nextPage = `/playlists/${req.params.playlistID}?page=${playlistPage.page + 1}`;
        playlistPage.links.lastPage = `/playlists/${req.params.playlistID}?page=${playlistPage.totalPages}`;
      }
      if (playlistPage.page > 1) {
        playlistPage.links.prevPage = `/playlists/${req.params.playlistID}?page=${playlistPage.page - 1}`;
        playlistPage.links.firstPage = `/playlists/${req.params.playlistID}?page=1`;
      }
      res.status(200).send(playlistPage);
    } else {
      next();
    }
  } catch(err) {
    next(err);
    console.error(" -- Error:", err);
    res.status(500).send({
      error: "Error fetching playlist. Try again later."
    });
  }
});

/*
* Add liked playlist to users library
*/
router.patch('/:id/liked', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.body.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else{
    try{
      const updateSuccessful = await likePlaylist(req.body.id, req.params.id);
      console.log("updateSuccessful:", updateSuccessful);
      if (updateSuccessful) {
        res.status(200).send();
      } else {
        next();
      }
    } catch(err) {
      next(err);
    }
  }
});

/*
* Remove liked playlist from users library
*/
router.patch('/:id/unliked', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.body.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else{
    try{
      const updateSuccessful = await unlikePlaylist(req.body.id, req.params.id);
      console.log("updateSuccessful:", updateSuccessful);
      if (updateSuccessful) {
        res.status(200).send();
      } else {
        next();
      }
    } catch(err) {
      next(err);
    }
  }
});

/*
* Delete an entire playlist
*/
router.delete('/:playlistID', requireAuthentication, checkAdmin, async (req, res, next) => {
  try {
    const playlist = await getPlaylistInfoByID(req.params.playlistID);
    if (req.user != playlist.owner && req.checkAdmin == 0) {
      res.status(403).send({
        error: "Unauthorized to the playlist: " 
      });
    } else{
      const deleteSuccessful = await deletePlaylistById(req.params.playlistID);
      if (deleteSuccessful) {
        res.status(200).end();
      } else {
        next();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to delete playlist.  Please try again later."
    });
  }
});

module.exports = router;
  