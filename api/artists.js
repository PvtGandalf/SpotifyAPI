const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');

const { 
    checkAdmin,
    requireAuthentication
  } = require('../lib/auth');

const {
    ArtistSchema,
    insertNewArtist,
    updateArtist,
    deleteArtistById,
    getArtistById,
    likeArtist,
    unlikeArtist
} = require('../models/artists');

/*
* Create artist
*/
router.post('/', checkAdmin, async (req, res) => {
  if (validateAgainstSchema(req.body, ArtistSchema)) {
    if(req.checkAdmin == 0) {
      res.status(403).send({
        error: "Unauthorized to create an artist."
      });
    }
    else {
      try {
        const id = await insertNewArtist(req.body);
        res.status(201).send({
          id: id,
          links: {
            followers: `/users/${id}`
          }
        });
      } catch (err) {
      next(err);
      }
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid user object."
    });
  }
});

/*
* Update artist
*/
router.put('/:id', checkAdmin, async (req, res, next) => {
  if (validateAgainstSchema(req.body, ArtistSchema)) {
    if (req.checkAdmin == 0) {
      res.status(403).send({
        error: "Unauthorized to update an artist."
      });
    } else {
      try {
        await updateArtist(req.body, req.params.id);
        res.status(201).send({
          id: req.params.id,
        });
      } catch (err) {
        next(err);
      }
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid user object."
    });
  }
});

/*
* Add liked artist to users library
*/
router.patch('/:id/liked', requireAuthentication, checkAdmin, async (req, res, next) => {
  console.log("user: ", req.user, "id: ", req.body.id);
  if (req.user !== req.body.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else{
    try{
      const updateSuccessful = await likeArtist(req.body.id, req.params.id);
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
* Remove liked artist from users library
*/
router.patch('/:id/unliked', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.body.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else{
    try{
      const updateSuccessful = await unlikeArtist(req.body.id, req.params.id);
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
 * Route to delete an artist.
 */
router.delete('/:id', checkAdmin, async (req, res, next) => {
  if (req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to delete an artist."
    });
  } else {
    try {
      const deleteSuccessful = await deleteArtistById(req.params.id);
      if (deleteSuccessful) {
        res.status(204).end();
      } else {
        next();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send({
        error: "Unable to delete artist.  Please try again later."
      });
    }
  }
});

/*
* Get artist information
*/
router.get('/:id', async (req, res, next) => {
      try{
        const artist = await getArtistById(req.params.id);
        console.log("artist:", artist);
        if (artist) {
          res.status(200).send(artist);
        } else {
          next();
        }
      } catch(err) {
        next(err);
        /*console.error(" -- Error:", err);
        res.status(500).send({
          error: "Error fetching user. Try again later."
        });*/
      }
});

module.exports = router;
