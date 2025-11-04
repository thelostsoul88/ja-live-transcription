const statusEl = document.getElementById("status");
const finalEl = document.getElementById("finalText");
const interimEl = document.getElementById("interimText");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const stopBtn = document.getElementById("stopBtn");

let socket = null;
let mediaStream = null;
let mediaRecorder = null;

let finalTranscript = "";

let isPaused = false;
let isStreaming = false;

const setButtonsState = (state) => {
  if (state === "idle") {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
  } else if (state === "listening") {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    stopBtn.disabled = false;
  } else if (state === "paused") {
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
    stopBtn.disabled = false;
  }
};

const startMedia = async () => {
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
    },
  });

  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: "audio/webm;codecs=opus",
  });

  mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(event.data);
    }
  });
  mediaRecorder.start(250);
};

const stopMedia = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
  }
  mediaRecorder = null;
  mediaStream = null;
};

startBtn.addEventListener("click", async () => {
  finalTranscript = "";
  finalEl.textContent = "";
  interimEl.textContent = "";

  statusEl.textContent = "Connecting WebSocket…";

  socket = new WebSocket(`ws://${location.host}/stream`);
  socket.binaryType = "arraybuffer";

  socket.onopen = async () => {
    console.log("Browser WS connected");
    statusEl.textContent = "Starting microphone…";

    try {
      await startMedia();
      statusEl.textContent = "Listening (streaming to Deepgram ja)…";
      isStreaming = true;
      isPaused = false;
      setButtonsState("listening");
    } catch (err) {
      console.error("Error starting media:", err);
      statusEl.textContent = "Error accessing microphone";
    }
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === "transcript") {
      if (msg.isFinal) {
        finalTranscript += msg.text + " ";
        finalEl.textContent = finalTranscript.trim();
        interimEl.textContent = "";
      } else {
        interimEl.textContent = msg.text;
      }
    }
  };

  socket.onerror = (err) => {
    console.error("Browser WS error:", err);
    statusEl.textContent = "WebSocket error";
  };

  socket.onclose = () => {
    console.log("Browser WS closed");
    statusEl.textContent = "Idle";
    setButtonsState("idle");
    stopMedia();
    isStreaming = false;
  };
});

pauseBtn.addEventListener("click", () => {
  if (!isStreaming || !mediaRecorder) return;
  isPaused = true;
  isStreaming = false;
  stopMedia();
  statusEl.textContent = "Paused (WS still open)";
  setButtonsState("paused");
});

resumeBtn.addEventListener("click", async () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  try {
    await startMedia();
    statusEl.textContent = "Listening (resumed)…";
    isStreaming = true;
    isPaused = false;
    setButtonsState("listening");
  } catch (err) {
    console.error("Error resuming media:", err);
    statusEl.textContent = "Error resuming microphone";
  }
});

stopBtn.addEventListener("click", () => {
  isStreaming = false;
  isPaused = false;
  stopMedia();
  if (socket) {
    socket.close();
    socket = null;
  }
  statusEl.textContent = "Stopped";
  setButtonsState("idle");
});

setButtonsState("idle");
