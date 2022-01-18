const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');

const { extractValidFields } = require('../lib/validation');

const bcrypt = require('bcryptjs');
const { get } = require('../api');

/*
* Schema for a User
*/
const UserSchema = {
    name: { required: true },
    username: { required: true },
    email: { required: true },
    password: { required: true},
    admin: {required: false}
};
exports.UserSchema = UserSchema;

/*
* Sign up a new user
*/
async function insertNewUser(user) {
    const db = getDBReference();
    const collection = db.collection('users');
    const userToInsert = extractValidFields(user, UserSchema);
    console.log("  -- userToInsert before hashing:", userToInsert);
    userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
    console.log("  -- userToInsert after hashing:", userToInsert);
    
    const result = await collection.insertOne(userToInsert);

    //console.log("result.id:",result.id);
    console.log("result.insertId:", result.insertedId);
    return result.insertedId;
}
exports.insertNewUser = insertNewUser;

/*
* Fetch a user from the Mongo DB based on user ID
*/
async function getUserById(id, includePassword) {
    console.log("in getUser");
    const db = getDBReference();
    const collection = db.collection('users');
    const result = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();

    if (result.length == 0){
        return null;
    } else {
        if (includePassword == true){
            return result[0];
        } else {
            return {
                "id": result[0]._id,
                "name": result[0].name,
                "username": result[0].username,
                //"email": result[0].email,
                "playlists": result[0].playlists,
                "followers": result[0].followers,
                "following": result[0].following
            };
        } 
    }
}
exports.getUserById = getUserById;

/*
* Fetch a user from the Mongo DB based on username
*/
async function getUserByUsername(username, includePassword) {
    const db = getDBReference();
    const collection = db.collection('users');

    const result = await collection
      .find({ username: username })
      .toArray();

    if (result.length == 0){
        return null;
    } else {
        if (includePassword == true){
            return result[0];
        } else {
            return {
                "id": result[0]._id,
                "name": result[0].name,
                "username": result[0].username,
                //"email": result[0].email,
                "playlists": result[0].playlists,
                "followers": result[0].followers,
                "following": result[0].following
            };
        } 
    }
}
exports.getUserByUsername = getUserByUsername;

/*
* Fetch a user from the Mongo DB based on user id
*/
async function getUserInfoByID(id) {
    const db = getDBReference();
    const collection = db.collection('users');

    const result = await collection.find(
        { _id: new ObjectId(id) }
    ).toArray();

    if (result.length == 0){
        return null;
    } else {
        return {
            "id": result[0]._id,
            "name": result[0].name,
            "username": result[0].username,
            //"email": result[0].email,
            "playlists": result[0].playlists,
            "followers": result[0].followers,
            "following": result[0].following, 
        };
    }
}
exports.getUserInfoByID = getUserInfoByID;


async function getUser(id) {
    const db = getDBReference();
    const collection = db.collection('users');

    const result = await collection
      .find({ _id: new ObjectId(id) })
      .toArray();
    
    return result[0];
}

/*
* Fetch a user from the Mongo DB based on user ID
*/
async function getUserFollowersById(id) {
    const user = await getUser(id);
    if (user.followers) {
        const count = user.followers.length
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
        followers = user.followers.slice(offset, end);

        return {
            followers: followers,
            page: page,
            totalPages: lastPage,
            pageSize: pageSize,
            count: count
        };
    } else {
        return null;
    }
}
exports.getUserFollowersById = getUserFollowersById;


/*
* Fetch a user from the Mongo DB based on user ID
*/
async function getUserFollowingById(id, page) {
    const user = await getUser(id);
    if (user.following) {
        const count = user.following.length
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
        following = user.following.slice(offset, end);

        return {
            following: following,
            page: page,
            totalPages: lastPage,
            pageSize: pageSize,
            count: count
        };
    } else {
        return null;
    }
}
exports.getUserFollowingById = getUserFollowingById;

/*
* Check not already following user
*/
async function checkFollowing(id, followingId) {
    const db = getDBReference();
    const collection = db.collection('users');

    const result = await collection.find({
        _id: new ObjectId(id),
        following: followingId
    }).toArray();

    console.log("checkFollowing result: ", result);
    return result;
}
exports.checkFollowing = checkFollowing;

/*
* Have two users start following each other
*/
async function followUser(id, followingId) {
    const db = getDBReference();
    const collection = db.collection('users');
    const followingUser = await getUserById(followingId, false);
    const user = await getUserById(id, false);
    const result1 = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { "following": {"name": followingUser.name, "username": followingUser.username, "id": followingId }}}
    );
    //console.log("result1: ", result1)
    const success1 = result1.matchedCount > 0;
    console.log("success1: ", success1);
    if (!result1.matchedCount > 0){
        return null;
    } else {
        const result2 = await collection.updateOne(
            { _id: new ObjectId(followingId) },
            { $push: { "followers": {"name": user.name, "username": user.username, "id": id }}}
        );
        const success2= result2.matchedCount > 0;
        console.log("success2: ", success2);
        if (!result2.matchedCount > 0){
            const result3 = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $pull: { "following": followingId }}
            );
            print("result3: ", result3)
            return null;
        } else {
            return {
                "following": followingId
            };
        }
    }
}
exports.followUser = followUser;

/*
* Have two users unfollow each other
*/
async function unfollowUser(id, followingId) {
    const db = getDBReference();
    const collection = db.collection('users');

    const result1 = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { "following": {"id": followingId} }}
    );

    const result2 = await collection.updateOne(
        { _id: new ObjectId(followingId) },
        { $pull: { "followers": {"id": id} }}
    );

    if (!result1.matchedCount > 0 || !result2.matchedCount > 0){
        return null;
    } else {
        return {
            "unfollowing": followingId
        };
    }
}
exports.unfollowUser = unfollowUser;


/*
* Check to see if username is already in use
*/
async function newUsername(username) {
    const db = getDBReference();
    const collection = db.collection('users');

    const result = await collection
      .find({ username: username })
      .toArray();
    
    console.log("newUser result: ", result);
    if (result.length == 0){
        console.log("hi")
        return true;
    } else{
        return false;
    }
}
exports.newUsername = newUsername;

/*
* User adds playlist in library
*/
async function addPlaylist(id, playlist) {
    const db = getDBReference();
    const collection = db.collection('users');
    const user = await getUserInfoByID(id);
    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { "playlists": {"name": playlist.name, "owner": user.username, "id": playlist._id }}}
    );
    return result.matchedCount > 0
}
exports.addPlaylist = addPlaylist;

/*
* User removes playlist in library
*/
async function removePlaylist(id, playlist) {
    const db = getDBReference();
    const collection = db.collection('users');
    user = await getUserById(id);
    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { "playlists": {"id": new ObjectId(playlist)} }}
    );
    return result.matchedCount > 0
}
exports.removePlaylist = removePlaylist;

/*
* User adds artist in library
*/
async function addArtist(id, artist) {
    const db = getDBReference();
    const collection = db.collection('users');
    const user = await getUserInfoByID(id);
    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { "artists": {"name": artist.name, "id": artist.id }}}
    );
    return result.matchedCount > 0
}
exports.addArtist = addArtist;

/*
* User removes artist in library
*/
async function removeArtist(id, artist) {
    const db = getDBReference();
    const collection = db.collection('users');
    user = await getUserById(id);
    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $pull: { "artists": {"id": new ObjectId(artist)} }}
    );
    return result.matchedCount > 0
}
exports.removeArtist = removeArtist;

/*
* get user's playlist in library
*/
async function getUserPlaylists(id) {
    const db = getDBReference();
    const collection = db.collection('users');
    user = await getUserById(id, false);
    const result = await collection.find(
        { _id: new ObjectId(id) },
    ).toArray();
    return result[0].playlists;
}
exports.getUserPlaylists = getUserPlaylists;

/*
* Compare user credentials to user DB
*/
async function validateUserById(id, password) {
    const user = await exports.getUserById(id, true);
    return user && await bcrypt.compare(password, user.password);
}
exports.validateUserById = validateUserById;

/*
* Compare user credentials using username to user DB
*/
async function validateUserByUsername(username, password) {
    const user = await exports.getUserByUsername(username, true);
    return user && await bcrypt.compare(password, user.password);
}
exports.validateUserByUsername = validateUserByUsername;