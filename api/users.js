const router = require('express').Router();

const {
  generateAuthToken,
  //generateAuthTokenByUsername,
  requireAuthentication,
  checkAdmin,
  checkAdminSignedin
} = require('../lib/auth');

const { validateAgainstSchema } = require('../lib/validation');

const {
  UserSchema,
  insertNewUser,
  validateUserById,
  validateUserByUsername,
  getUserById,
  getUserByUsername,
  getUserFollowersById,
  getUserFollowingById,
  followUser,
  unfollowUser,
  checkFollowing,
  newUsername,
  getUserPlaylists
} = require('../models/users');

/*
* Create user
*/
router.post('/', checkAdminSignedin, async (req, res) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    console.log("admin: ", req.adminSignedIn);
    console.log("admin: ", req.body.admin);
    if (req.body.admin == true && req.adminSignedIn == 0) {
      console.log("1");
      res.status(400).send({
        error: "No permissions to make an admin user."
      });
    }
    else {
      try {
        if (await newUsername(req.body.username) == true) {
          const id = await insertNewUser(req.body);
          res.status(201).send({
            id: id,
            links: {
              user: `/users/${id}`
            }
          });
        } else {
          res.status(400).send({
            error: "This username is already being used. Choose a different username."
          });
        }
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
* Login user
*/
router.post('/login', async (req, res, next) => {
  if (req.body && req.body.username && req.body.password) {
    try {
      const authenticated = await validateUserByUsername(req.body.username, req.body.password);
      if (authenticated) {
        const user = await getUserByUsername(req.body.username);
        res.status(200).send({
          id: user.id,
          token: generateAuthToken(user.id)
        });
      } else {
        res.status(401).send({
          error: "Invalid authentication credentials"
        });
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.status(404).send({
      err: "The path " + res.originalUrl + " doesn't exist"
    });
  }
});

/*
* Get user information
*/
router.get('/:id', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.params.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      const user = await getUserById(req.params.id);
      console.log("users:", user);
      if (user) {
        res.status(200).send(user);
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  }
});

/*
* Get user followers
*/
router.get('/:id/followers', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.params.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      const followersPage = await getUserFollowersById(req.params.id, req.query.page || 1);
      console.log("followersPage: ", followersPage)
      if (followersPage) {
        followersPage.links = {};
        if (followersPage.page < followersPage.totalPages) {
          followersPage.links.nextPage = `/users/${req.params.id}/followers?page=${followersPage.page + 1}`;
          followersPage.links.lastPage = `/users/${req.params.id}/followers?page=${followersPage.totalPages}`;
        }
        if (followersPage.page > 1) {
          followersPage.links.prevPage = `/users/${req.params.id}/followers?page=${followersPage.page - 1}`;
          followersPage.links.firstPage = `/users/${req.params.id}/followers?page=1`;
        }
        console.log("Following:", followersPage);

        res.status(200).send(followersPage);
      } else {
        res.status(200).send({
          "followers": []
        })
      }
    } catch (err) {
      next(err);
    }
  }
});

/*
* Get user following
*/
router.get('/:id/following', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.params.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      const followingPage = await getUserFollowingById(req.params.id, req.query.page || 1);
      if (followingPage) {
        followingPage.links = {};
        if (followingPage.page < followingPage.totalPages) {
          followingPage.links.nextPage = `/users/${req.params.id}/following?page=${followingPage.page + 1}`;
          followingPage.links.lastPage = `/users/${req.params.id}/following?page=${followingPage.totalPages}`;
        }
        if (followingPage.page > 1) {
          followingPage.links.prevPage = `/users/${req.params.id}/following?page=${followingPage.page - 1}`;
          followingPage.links.firstPage = `/users/${req.params.id}/following?page=1`;
        }
        console.log("Following:", followingPage);

        res.status(200).send(followingPage);
      } else {
        res.status(200).send({
          "following": []
        })
      }
    } catch (err) {
      next(err);
    }
  }
});

/*
* Follow a user
*/
router.patch('/:id/follow', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.body && req.body.followingId) {
    if (req.user !== req.params.id && req.checkAdmin == 0) {
      res.status(403).send({
        error: "Unauthorized to access the specified resource"
      });
    } else {
      followingId = req.body.followingId;
      id = req.params.id;
      try {
        result = await checkFollowing(id, followingId);
        if (result.length == 0) {
          const updateSuccessful = await followUser(id, followingId);
          console.log("updateSuccessful:", updateSuccessful);

          if (updateSuccessful) {
            res.status(200).send();
          } else {
            next();
          }
        } else {
          res.status(400).send({
            error: "Already following user: " + followingId
          });
        }
      } catch (err) {
        next(err);
      }
    }
  } else {
    res.status(400).send({
      error: "Request body must contain an 'followingId'."
    });
  }
});

/*
* Unfollow a user
*/
router.patch('/:id/unfollow', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.body && req.body.followingId) {
    if (req.user !== req.params.id && req.checkAdmin == 0) {
      res.status(403).send({
        error: "Unauthorized to access the specified resource"
      });
    } else {
      try {
        const updateSuccessful = await unfollowUser(req.params.id, req.body.followingId);
        console.log("updateSuccessful:", updateSuccessful);
        if (updateSuccessful) {
          res.status(200).send();
        } else {
          next();
        }
      } catch (err) {
        next(err);
      }
    }
  } else {
    res.status(400).send({
      error: "Request body must contain an 'followingId'."
    });
  }
});

router.get('/:id/playlists', requireAuthentication, checkAdmin, async (req, res, next) => {
  if (req.user !== req.params.id && req.checkAdmin == 0) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      const playlists = await getUserPlaylists(req.params.id);
      console.log("playlists:", playlists);
      if (playlists.length > 0) {
        res.status(200).send({ "playlists": playlists });
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  }
});

module.exports = router;
