let socket;

let sensorCheckTimedOut = false;
let sensorCheckStarted = false;
const CLIENT_ROLE = "mobile";
let capture;
let frameSendCanvas;
let frameSendContext;
let lastFrameSentAt = 0;
const FRAME_INTERVAL_MS = 140;
let remoteFrame = null;
let queuedRemoteFrameData = null;
let isDecodingRemoteFrame = false;

let ratioScale = 2;

let otherImgWidth;
let otherImgHeight;

function setup() {
  createCanvas(windowWidth, windowHeight);
  socket = io();
  setupCameraStream();

  socket.on("cameraFrame", (payload) => {
    if (!payload || payload.role === CLIENT_ROLE || typeof payload.imageData !== "string") {
      return;
    }

    queueRemoteFrame(payload.imageData);
    otherImgWidth=payload.w;
    otherImgHeight=payload.h;
  });


}

function draw() {
  sendCameraFrameIfDue();

  background(30);

  image(capture, 0, 0, width, height);

  drawRemoteFrameOverlay();

  
  

}

function drawRemoteFrameOverlay() {
  if (!remoteFrame) {
    return;
  }

  
  image(remoteFrame, width/2-otherImgWidth/2, 16, otherImgWidth, otherImgHeight);
}

function queueRemoteFrame(imageData) {
  queuedRemoteFrameData = imageData;
  if (!isDecodingRemoteFrame) {
    decodeLatestRemoteFrame();
  }
}

function decodeLatestRemoteFrame() {
  if (!queuedRemoteFrameData) {
    isDecodingRemoteFrame = false;
    return;
  }

  isDecodingRemoteFrame = true;
  const nextData = queuedRemoteFrameData;
  queuedRemoteFrameData = null;

  loadImage(nextData, (img) => {
    remoteFrame = img;
    isDecodingRemoteFrame = false;

    if (queuedRemoteFrameData) {
      decodeLatestRemoteFrame();
    }
  }, () => {
    isDecodingRemoteFrame = false;

    if (queuedRemoteFrameData) {
      decodeLatestRemoteFrame();
    }
  });
}

function setupCameraStream() {
  capture = createCapture({ video: { facingMode: "environment" }, audio: false });
  capture.size(width/ratioScale, height/ratioScale);
  capture.hide();

  frameSendCanvas = document.createElement("canvas");
  frameSendContext = frameSendCanvas.getContext("2d");
}

function sendCameraFrameIfDue() {
  if (!socket || socket.connected !== true) {
    return;
  }

  if (!capture || !capture.elt || capture.elt.videoWidth === 0) {
    return;
  }

  if (millis() - lastFrameSentAt < FRAME_INTERVAL_MS) {
    return;
  }

  const sourceVideo = capture.elt;
  const targetWidth = Math.round(width/ratioScale);
  const targetHeight = Math.round((sourceVideo.videoHeight / sourceVideo.videoWidth) * targetWidth);

  frameSendCanvas.width = targetWidth;
  frameSendCanvas.height = targetHeight;
  frameSendContext.drawImage(sourceVideo, 0, 0, targetWidth, targetHeight);

  const imageData = frameSendCanvas.toDataURL("image/jpeg", 0.5);
  socket.emit("cameraFrame", {
    role: CLIENT_ROLE,
    imageData,
    timestamp: Date.now(),
    w:targetWidth,
    h:targetHeight,
    sc: ratioScale
  });

  lastFrameSentAt = millis();
}




