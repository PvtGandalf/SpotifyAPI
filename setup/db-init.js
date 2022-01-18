// Create the user with read/write access to out spotify database
db.createUser(
  {
    user: "user",
    pwd: "hunter2",  // or cleartext password
    roles: [
       { role: "readWrite", db: "spotify" }
    ]
  }
)

// Use our spotify database
use spotify

// Insert sample user data into our spotify database *Note: all passwords are "hunter2"
db.users.insertMany([
  {
    "name" : "Anakin Skywalker",
    "username" : "darthHelmet123",
    "email" : "madman27@gmail.com",
    "password" : "$2a$08$oD3yC3/ivWxYo7JfhF.hO.P6kF2g/NNYwxR5bBgorpM9Fgpez9LjG",
    "admin" : true
  },
  {
    "name" : "Luke Skywalker",
    "username" : "oneHand123",
    "email" : "ih8udad@gmail.com",
    "password" : "$2a$08$Ge/AuNVpmDB1kkQQBgDaU.XaJGRMUSHy6gfuSjM20Zlx8h13RG5sW",
    "admin" : true
  },
  {
    "name" : "Han Solo",
    "username" : "shootFirst123",
    "email" : "iknow@gmail.com",
    "password" : "$2a$08$yDGBRUDoslXMtfdHn0loUeKP2q1R7b8R2ze4vRif5oqlcR4lWplGG",
    "admin" : false
  }
])

// Insert sample artist data into our spotify database
db.artists.insertMany([
  {
    "name" : "Lil Grogu",
    "bio" : "I'm adorable",
    "monthlyListeners" : "9001"
  },
  {
    "name" : "Yoda",
    "bio" : "Sick bars, I spit",
    "monthlyListeners" : "3333"
  }
])

// Insert sample song data into our spotify database
db.songs.insertMany([
  {
    "name" : "Innocent",
    "album" : "DarkSide",
    "artist" : "Lil Grogu",
    "streams" : "21356"
  },
  {
    "name" : "Green Hands",
    "album" : "DarkSide",
    "artist" : "Lil Grogu",
    "streams" : "75600"
  }
])

// Insert sample playlist data into our spotify database (Note: These must be added within Postman)
  { "name" : "Kashyyyk Hits" }
  { "name" : "Jabba Jabba" }
  { "name" : "Boba's Beats" }
  { "name" : "I'm not a clone" }