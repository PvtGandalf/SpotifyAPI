# final-project-cs493-group2

## Members
 - Tobias Bird
 - Harper Swenson
 - Doug Lloyd
 - Jaiden Hodson

## API Description
We will be making an API for the application “Spotify”. This application provides an easy way for users to find and listen to songs that Artists have added to the Spotify database. This application has users who, after signing in, can listen to any song in the database. A user who is not logged in will have to wait a set period of time after streaming a certain amount of songs to simulate an advertisement. To make it easier for users, the application has the categories Artists, Albums, and Playlists to find songs and similar songs. Users can also save songs, albums, artists, and playlists so users don’t need to keep searching for the songs they want to listen to. Albums are a collection of songs an artist made for a specific release. Artists have albums they released and 5 most popular songs shown when searched for. Playlists are created by either users or spotify to combine songs to a singular place. If a user has created a playlist they have the ability to name or rename the album and to add or remove songs. This application will be streaming the audio files to users when they press play and pausing the stream when the user pauses.

## Entities Outlined
 - User
   - Username
   - Password
   - Followers
   - Following
 - Artist
   - Artist id
   - Name
   - Bio
   - Monthly listeners
   - Followers
 - Playlist
   - Playlist id
   - Name
   - Likes
 - Song
   - Song id
   - Album
   - Streams

## API Endpoints
 - Create a playlist
 - Remove a playlist
 - Rename a playlist
 - Add a song to a playlist

## Services
 - MongoDB
 - Docker
 - Redis
