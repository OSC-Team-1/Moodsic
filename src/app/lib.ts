const token = process.env.API_TOKEN_SPOTIFY
export async function getSongs(text:string) {
    text =
        text ||
        "never gonna give you up artist:Rick Astley\nclose to the edge artist:Yes";
    const songs = [];

    for (const line of text.split("\n")) {
        console.log(line);
        const API_URL = `https://api.spotify.com/v1/search?q=${line}&type=track&market=NZ&limit=5&offset=0`;

        const response = await fetch(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const json = await response.json();
        
        for (const song of json.tracks.items) {
            songs.push(song.uri);
        }
    }

    return songs;
}

// async function fetchWebApi(endpoint: string, method: string, body?: string) {
//     const res = await fetch(`https://api.spotify.com/${endpoint}`, {
//         headers: {
//             Authorization: `Bearer ${token}`,
//         },
//         method,
//         body: JSON.stringify(body),
//     });
//     return await res.json();
// }

// async function getTopTracks() {
//     return (
//         await fetchWebApi(
//             "v1/me/top/tracks?time_range=long_term&limit=10",
//             "GET"
//         )
//     ).items;
// }

// async function getTopArtists() {
//     return (
//         await fetchWebApi(
//             "v1/me/top/artists?time_range=long_term&limit=10",
//             "GET"
//         )
//     ).items;
// }

// export async function getUserInformation() {
//     const topTracks = await getTopTracks();
//     const tracks = topTracks?.map(
//         ({ name, artists }) =>
//             `${name} by ${artists
//                 .map((artist: { name: any }) => artist.name)
//                 .join(", ")}`
//     );

//     const topArtists = await getTopArtists();
//     const artists = topArtists?.map((artist: { name: any }) => artist.name);

//     return {
//         artists: artists || ["Rick Astley"],
//         tracks: tracks || ["Never gonna give you up"],
//     };
// }

// const play = (spotify_uri: string, id: string) => {
//     fetch(`https://api.spotify.com/v1/me/player/play?device_id=${id}`, {
//         method: "PUT",
//         body: JSON.stringify({ uris: [spotify_uri] }),
//         headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//         },
//     });
// };

// export async function playTrack(trackUrl: string, deviceId?: string) {
//     const response = await fetch(
//         `https://api.spotify.com/v1/me/player/play${
//             deviceId ? `?device_id=${deviceId}` : ""
//         }`,
//         {
//             method: "PUT",
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 uris: [trackUrl], // e.g. "spotify:track:4uLU6hMCjMI75M1A2tKUQC"
//             }),
//         }
//     );

//     if (!response.ok) {
//         const error = await response.json();
//         throw new Error(`Spotify API error: ${JSON.stringify(error)}`);
//     }

//     console.log("Playback started!");
// }
