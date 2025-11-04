const path = require("path");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");

require("dotenv").config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  console.error("ERROR: DEEPGRAM_API_KEY is not set in .env");
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "public")));

const wss = new WebSocket.Server({ server, path: "/stream" });

wss.on("connection", (clientWs) => {
  console.log("Browser client connected");
  const dgUrl =
    "wss://api.deepgram.com/v1/listen" +
    "?model=nova-2" +
    "&language=ja" +
    "&interim_results=true" +
    "&punctuate=true";

  const dgWs = new WebSocket(dgUrl, {
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  dgWs.on("open", () => {
    console.log("Connected to Deepgram");
  });

  dgWs.on("error", (err) => {
    console.error("Deepgram WS error:", err);
  });

  dgWs.on("close", () => {
    console.log("Deepgram connection closed");
    clientWs.close();
  });

  clientWs.on("message", (msg) => {
    if (dgWs.readyState === WebSocket.OPEN) {
      dgWs.send(msg);
    }
  });

  clientWs.on("close", () => {
    console.log("Browser client disconnected");
    if (
      dgWs.readyState === WebSocket.OPEN ||
      dgWs.readyState === WebSocket.CONNECTING
    ) {
      dgWs.close();
    }
  });

  clientWs.on("error", (err) => {
    console.error("Browser WS error:", err);
  });

  dgWs.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      const alt = data?.channel?.alternatives?.[0];
      const transcript = alt?.transcript;

      if (!transcript) return;

      const payload = {
        type: "transcript",
        text: transcript,
        isFinal: !!data.is_final,
      };

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    } catch (err) {
      console.error("Error parsing Deepgram message:", err);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
