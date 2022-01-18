const express = require('express');
const morgan = require('morgan');
const redis = require('redis');

const api = require('./api');

const { connectToDB } = require('./lib/mongo');
const { connectToRabbitMQ } = require('./lib/rabbitmq');
const { checkLoggedIn } = require('./lib/auth');
const app = express();
const port = process.env.PORT || 8000;

/*
 * 1) Redis server needs to be set up with the --requirepass "yourpassword" 
 * option at the end of the create command
 * 2) Export environment variable with same password
*/
const redisClient = redis.createClient( {
  port: process.env.REDIS_PORT || '6379',
  host: process.env.REDIS_HOST || 'localhost',
  password: process.env.REDIS_PASSWORD
});

const rateLimitWindowMS = 60000;
//const rateLimitMaxRequests = 5;
rateLimitMaxRequests = 5;

function getUserTokenBucket(ip){
  return new Promise((resolve, reject) => {
    redisClient.hgetall(ip, (err, tokenBucket) => {
      if (err) {
        reject(err);
      } else if (tokenBucket) {
        tokenBucket.tokens = parseFloat(tokenBucket.tokens);
        resolve(tokenBucket);
      } else {
        resolve({
          tokens: rateLimitMaxRequests,
          last: Date.now()
        });
      }
    });
  });
}

function saveUserTokenBucket(ip, tokenBucket){
  return new Promise((resolve, reject) => {
    redisClient.hmset(ip, tokenBucket, (err, resp) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function rateLimit(req, res, next) {
  try{
    //rateLimitMaxRequests = 5;
    if(checkLoggedIn(req, res, next) == true){
      rateLimitMaxRequests = 10;
    } else {
      rateLimitMaxRequests = 5;
    }

    console.log("maxRequests: ", rateLimitMaxRequests);
    const tokenBucket = await getUserTokenBucket(req.ip);
    const currentTimestamp = Date.now();
    const ellapsedTime = currentTimestamp - tokenBucket.last;
    tokenBucket.tokens += ellapsedTime * (rateLimitMaxRequests / rateLimitWindowMS);
    tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitMaxRequests);
    tokenBucket.last = currentTimestamp;
    if (tokenBucket.tokens >= 1) {
      console.log("tokenBuckets: ", tokenBucket.tokens);
      tokenBucket.tokens -= 1;
      await saveUserTokenBucket(req.ip, tokenBucket);
      next();
    } else{
      res.status(429).send({
        error: "Too many request per minute. Please wait a bit..."
      });
    }
  } catch (err) {
    next();
  }
}

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));
app.use(rateLimit);

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (err, req, res, next) {
  console.error(err);
  res.status(500).send({
    error: "An error occurred. Try again later."
  });
})

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

connectToDB(async () => {
  //await connectToRabbitMQ('photos');
  app.listen(port, () => {
    console.log("== Server is running on port", port);
  });
});