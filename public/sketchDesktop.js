let socket;
let cvn;
let capture;

const CLIENT_ROLE = "desktop";
let frameSendCanvas;
let frameSendContext;
let lastFrameSentAt = 0;
const FRAME_INTERVAL_MS = 140;
let remoteFrame = null;
let queuedRemoteFrameData = null;
let isDecodingRemoteFrame = false;

function setup() {
  cvn=createCanvas(windowWidth, windowHeight);
  
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide(); // Hide the default HTML element

  //ratio = windowWidth / 640;
  frameSendCanvas = document.createElement("canvas");
  frameSendContext = frameSendCanvas.getContext("2d");
  //frameSendCanvas is not added to the DOM since we only use it for off-screen processing

  // Connect to the WebSocket server
  socket = io();

  

  socket.on("cameraFrame", (payload) => {
    if (!payload || payload.role === CLIENT_ROLE || typeof payload.imageData !== "string") {
      return;
    }

    queueRemoteFrame(payload.imageData);
  });
}

function draw() {
  //place the image in the center of the screen
  image(capture, width/2 - capture.width /2, height/2 - capture.height /2);

  sendCameraFrameIfDue();

  drawRemoteFrameOverlay();

}

function drawRemoteFrameOverlay() {
  if (!remoteFrame) {
    return;
  }

 
  const previewWidth = 640;
  const previewHeight = 480;
  //draw the remote frame in the center below the local capture
  image(remoteFrame, width / 2 - previewWidth / 2, height / 2 + capture.height / 2, previewWidth, previewHeight);
  
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
  const targetWidth = 320;
  const targetHeight = Math.round((sourceVideo.videoHeight / sourceVideo.videoWidth) * targetWidth);

  frameSendCanvas.width = targetWidth;
  frameSendCanvas.height = targetHeight;
  frameSendContext.drawImage(sourceVideo, 0, 0, targetWidth, targetHeight);

  const imageData = frameSendCanvas.toDataURL("image/jpeg", 0.55);
  socket.emit("cameraFrame", {
    role: CLIENT_ROLE,
    imageData,
    timestamp: Date.now()
  });

  lastFrameSentAt = millis();
}



