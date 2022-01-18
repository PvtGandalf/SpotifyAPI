const { ObjectId } = require('mongodb');

const { getDBReference } = require('../lib/mongo');

const jwt = require('jsonwebtoken');

const secretKey = "SuperSecret";

function generateAuthToken(userId) {
    const payload = { sub: userId };
    return jwt.sign(payload, secretKey, { expiresIn: '24h' });
}
exports.generateAuthToken = generateAuthToken;

function checkLoggedIn(req, res, next) {
    console.log(" -- check Logged in");
    const authHeader = req.get("Authorization") || '';
    console.log("authHeader: ", authHeader)
    if(authHeader == ''){
        return false;
    }
    const authHeaderParts = authHeader.split(' ');
    console.log(" -- authHeaderParts:", authHeaderParts);
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey); 
        req.user = payload.sub;
        return true;
    } catch (err) {
        return false;
    }
}
exports.checkLoggedIn = checkLoggedIn;

function requireAuthentication(req, res, next) {
    console.log(" -- verify authentication");
    const authHeader = req.get("Authorization") || '';
    const authHeaderParts = authHeader.split(' ');
    console.log(" -- authHeaderParts:", authHeaderParts);
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey); 
        req.user = payload.sub;
        next();
    } catch (err) {
        res.status(401).send({
            error: "Invalid authentication token."
        });
    }
}
exports.requireAuthentication = requireAuthentication;

async function checkAdmin(req, res, next){
    const db = getDBReference();
    const collection = db.collection('users');
    console.log(" -- checking Admin Status");
    console.log("user: ", req.user);
    try {
        const result = await collection
            .find({ _id: new ObjectId(req.user) })
            .toArray();
        console.log("1");
        console.log(" -- Admin Status: ", result[0].admin);
        req.checkAdmin = result[0].admin;
        next();
    } catch (err) {
        res.status(401).send({
            error: "Invalid user id."
        });
    }
}
exports.checkAdmin = checkAdmin;

async function checkAdminSignedin(req, res, next) {
    const db = getDBReference();
    const collection = db.collection('users');
    req.adminSignedIn = 0;
    console.log(" -- verify authentication");
    const authHeader = req.get("Authorization") || '';
    if(authHeader == '')
        next();
    else{
        const authHeaderParts = authHeader.split(' ');
    console.log(" -- authHeaderParts:", authHeaderParts);
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey); 
        user = payload.sub;
        const result = await collection
            .find({ _id: new ObjectId(user) })
            .toArray();
        if(result[0].admin == 1)
            req.adminSignedIn = 1;
        next();
    } catch (err) {
        next();
    }
    }
}
exports.checkAdminSignedin = checkAdminSignedin;