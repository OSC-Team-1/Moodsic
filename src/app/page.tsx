"use client";

import { GoogleGenAI } from "@google/genai";
import { useState, useEffect } from "react";
import { getUserInformation, getSongs, playTrack } from "./lib";
import { SpotifyEmbed } from "spotify-embed"; // import the SpotifyEmbed component

export default function Home() {
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
    const [status, setStatus] = useState<"idle" | "listening">("idle");
    const [mood, setMood] = useState("Default Text");
    const [songs, setSongs] = useState([]);
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const [artists, setArtists] = useState(["Rick Astley"]);
    const [tracks, setTracks] = useState(["Never gonna give you up"]);
    const requestLength = 10_000;

    useEffect(() => {
        (async () => {
            const sdata = await getUserInformation();
            setArtists(sdata.artists);
            setTracks(sdata.tracks);
            setSongs(sdata.tracks);
            console.log(sdata);
            console.log("Playing Song");
            await playTrack(
                "4PTG3Z6ehGkBFwjybzWkR8",
                "784c0691c1184a7db103d69f6a676e557e138800"
            );
        })();
        return () => {};
    }, []);

    function wait(delayInMS) {
        return new Promise((resolve) => setTimeout(resolve, delayInMS));
    }

    function startRecording(stream, lengthInMS) {
        let recorder = new MediaRecorder(stream);
        let data = [];
        recorder.ondataavailable = (event) => data.push(event.data);
        recorder.start();
        console.log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

        let stopped = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = (event) => reject(event.name);
        });

        let recorded = wait(lengthInMS).then(() => {
            if (recorder.state === "recording") {
                recorder.stop();
            }
        });

        return Promise.all([stopped, recorded]).then(() => data);
    }

    async function cam() {
        const reader = new FileReader();
        await navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                return startRecording(stream, requestLength);
            })
            .then((recordedChunks) => {
                //console.log(recordedChunks);
                let recordedBlob = new Blob(recordedChunks, {
                    type: "video/webm",
                });
                reader.readAsDataURL(recordedBlob);
            })
            .catch((error) => {
                console.log(error);
            });
        return reader;
    }

    function wait(delayInMS) {
        return new Promise((resolve) => setTimeout(resolve, delayInMS));
    }

    function startRecording(stream, lengthInMS) {
        let recorder = new MediaRecorder(stream);
        let data = [];
        recorder.ondataavailable = (event) => data.push(event.data);
        recorder.start();
        console.log(`${recorder.state} for ${lengthInMS / 1000} seconds…`);

        let stopped = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = (event) => reject(event.name);
        });

        let recorded = wait(lengthInMS).then(() => {
            if (recorder.state === "recording") {
                recorder.stop();
            }
        });

        return Promise.all([stopped, recorded]).then(() => data);
    }

    async function cam() {
        const reader = new FileReader();
        await navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                return startRecording(stream, 30000);
            })
            .then((recordedChunks) => {
                //console.log(recordedChunks);
                let recordedBlob = new Blob(recordedChunks, {
                    type: "video/webm",
                });
                reader.readAsDataURL(recordedBlob);
            })
            .catch((error) => {
                console.log(error);
            });
        return reader;
    }

    cam()
        .then((data) => {
            data.onload = () => {
                // base64 video is data.result
                // console.log(data.result);
            };
        })
        .catch((error) => {
            console.log(error);
        });

    const handleOnResult = async (voiceText: string) => {
        let base64video: string | ArrayBuffer | null = "";

        await cam()
            .then((data) => {
                data.onload = async () => {
                    // base64 video is data.result
                    const content = [
                        {
                            inlineData: {
                                mimeType: "video/webm",
                                data: data.result.slice(23),
                            },
                        },
                        {
                            text: `In the prompt, I have shown you a video recording of my emotes and text with what I am saying
            What I am saying "I am really sad"
            `,
                        },
                    ];
                    console.log("SENDING REQUEST TO GEMINI");
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-pro",
                        contents: content,

                        config: {
                            // thinkingConfig: {
                            //     thinkingBudget: -1,
                            // },
                            systemInstruction: `You are working as a sentiment analysis assistant who recommends music. Based on the 
            user's voice-to-text and video data, determine the user mood and a song you would recommend to match their mood based on their 
            favourite genre and artist. The moods you are to choose from are "joyful", "calm", "excited", "sad", "angry", 
            "fearful", "disgusted", "surprised", "curious", "conflicted" respond with only the mood. If they are in between 
            two moods, decide concretely which one they are in, you are only allowed to pick from the list
    
            The user likes to listen to artist such as ${artists}
            the user likes to listen to genres such as ${tracks}
            
            Based on the mood you have selected recommend me a song. RESPOND WITH JUST THE SONG TITLE AND ARTIST NAME IN LOWER CASE
            Connect the song title with "+" As an example, the song "Never gonna give you up" would become "never+gonna+give+you+up"
            Connect and captilise the artist name with "+" As an example, the artist "Rick Astley" would become "Rick+Astley"
    
            Finally, in the final respond, space seperate the song title and artist. As an example Never gonna give you up Rick Astley would become
            never+gonna+give+you+up Rick+Astley
    
            `,
                        },
                    });
                    setMood(response.text);

                    console.log(response.text);

                    const s = await getSongs(response.text)
                    setSongs(s);
                };
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const initSpeechRecognition = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;

        recognition.onstart = () => setStatus("listening");
        recognition.onresult = (e) => {
            handleOnResult(e.results[0][0].transcript);
        };
        recognition.onend = () => {
            setTimeout(() => recognition.start(), requestLength);
        };
        recognition.onerror = (e) => {
            console.error("Speech error:", e.error);
            setStatus("idle");
        };

        recognition.start();
    };
    return (
        <>
            Current Mood {mood}
            <button
                onClick={() => initSpeechRecognition()}
                className="border-2 border-black m-10"
            >
                CONNECT
            </button>
            {songs.map((song, idx) => (
                <SpotifyEmbed src={song} key={idx} />
            ))}
            <div
                className="w-6 h-6 rounded-full mx-auto"
                style={{
                    backgroundColor: status === "listening" ? "green" : "red",
                }}
            />
            <p>{status === "listening" ? "Listening..." : "Idle"}</p>
        </>
    );
}
