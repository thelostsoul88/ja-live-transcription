# Japanese Live Speech Transcription (ja-JP, Streaming)

This project implements a **real-time Japanese speech transcription** system.

When the user speaks into the microphone, audio is streamed to the backend over WebSocket.  
The backend forwards the audio to **Deepgram’s streaming ASR API** (`language=ja`) and sends back **interim** and **final** transcription segments in real time.

The solution is intentionally minimal (plain HTML/JS + Node) and focused on **speed, accuracy, and streaming behavior**, as required by the task.

---

## Features

- **Live microphone capture** in the browser (`getUserMedia` + `MediaRecorder`)
- **WebSocket streaming** of audio from frontend → backend → Deepgram
- **Interim & final transcripts**:
  - Interim results appear while the user is still speaking
  - Final segments are emitted when the ASR finalizes a phrase
- **Optional timestamps**: `startMs` / `endMs` (milliseconds)
- **Controls**:
  - `Start` – start a streaming session
  - `Pause` – temporarily stop sending audio (WS stays open)
  - `Resume` – continue streaming in the same session
  - `Stop` – fully stop streaming and close the WebSocket
- **Privacy-friendly**:
  - No audio is stored on disk
  - Audio is only forwarded in real time to the ASR service

---

## Tech Stack

- **Frontend**

  - Plain HTML, CSS, vanilla JavaScript
  - `navigator.mediaDevices.getUserMedia` for microphone access
  - `MediaRecorder` for small audio chunks (webm/opus)
  - WebSocket client (`ws://…/stream`)

- **Backend**
  - Node.js (HTTP server)
  - Express – static hosting for the frontend
  - `ws` – WebSocket server for audio streaming
  - Deepgram streaming ASR API (`wss://api.deepgram.com/v1/listen`)

---

## Project Structure

ja-live-transcription/
package.json
server.js
.env
/public
index.html
index.js

---

## Setup & Run

Clone the repository

git clone
cd ja-live-transcription

### Install dependencies

npm install

Configure environment

Create .env in the project root:

DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY_HERE

### Start the server

node server.js

You should see something like:

Server listening on http://localhost:3000
