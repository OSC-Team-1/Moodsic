"use client";

import { GoogleGenAI } from "@google/genai";
import { useState } from "react";

export default function Home() {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
  const [status, setStatus] = useState<"idle" | "listening">("idle");
  const [mood, setMood] = useState("Default Text");
  const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        return startRecording(stream, 30000);
      })
      .then((recordedChunks) => {
        //console.log(recordedChunks);
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        reader.readAsDataURL(recordedBlob);
      })
      .catch((error) => {
        console.log(error);
      });
    return reader;
  }

  function test() {
    cam().then((data) => {
      data.onload = () => {
        // base64 video is data.result
        console.log(data.result);
      }
    }).catch((error) => {
      console.log(error);
    });

  const handleOnResult = async (voiceText: string) => {
    const prompt = `
        Input voice: "${voiceText}"
        `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,

      config: {
        thinkingConfig: {
          thinkingBudget: -1,
        },
        systemInstruction: `You are working as a sentiment analysis assistant. Based on the user's voice-to-text and video data,
        determine the user mood. The moods you are to choose from are "joyful", "calm",
        "excited", "sad", "angry", "fearful", "disgusted", "surprised", "curious", "conflicted" respond with only the mood.
        If they are in between two moods, decide concretely which one they are in, you are only allowed to pick from the list
        `,
      },
    });
    setMood(response.text);
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (e) => handleOnResult(e.results[0][0].transcript);
    recognition.onend = () => {
      setTimeout(() => recognition.start(), 2500);
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
      <button onClick={() => initSpeechRecognition()} className="border-2 border-black m-10">
        CONNECT
      </button>
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
