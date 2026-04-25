# You & Me – Bidirectional Camera Exchange Boilerplate

Small teaching/demo boilerplate to capture and exchange live camera images between two devices (mobile and desktop) via WebSockets, rendered in p5.js.

## What it does

- Opens the camera on both devices
- Captures frames periodically (≈7 fps) as JPEG using an offscreen canvas
- Sends frames via Socket.IO to the server, which relays them to the other device
- Each device displays its own camera feed full-screen and the remote camera feed as a small overlay, drawn entirely within p5.js using `loadImage`

## Test
* Desktop: `https://https://meandme-w6ix.onrender.com/desktop`
* Mobile: `https://https://meandme-w6ix.onrender.com/mobile`

## Tech stack

- Node.js + Express
- Socket.IO
- p5.js

## Project structure

```
.
├── server.js
├── package.json
├── public/
│   ├── mobile.html
│   ├── desktop.html
│   ├── sketchMobile.js
│   ├── sketchDesktop.js
│   └── libraries/
```

## Quick start

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Start the server:

	 ```bash
	 npm start
	 ```

3. Open clients:

- Desktop: `http://localhost:3000/desktop`
- Mobile: `http://localhost:3000/mobile`

If you want to use a real phone, open the server from your phone on the same network (use your computer's local IP instead of `localhost`).

## How the image transfer works

1. **Sender** draws the camera video into a small offscreen `<canvas>` (320 px wide on desktop, 240 px on mobile)
2. `canvas.toDataURL("image/jpeg", quality)` produces a Base64-encoded JPEG string
3. The string is sent via `socket.emit("cameraFrame", { role, imageData, timestamp })`
4. **Server** validates and relays it to all other connected clients via `socket.broadcast.emit`
5. **Receiver** calls p5's `loadImage(dataUrl, callback)` to decode the JPEG into a p5 image object
6. The decoded image is drawn with `image(remoteFrame, ...)` in the p5 draw loop

Incoming frames are queued so that only the latest frame is decoded at any time, avoiding lag build-up.

## Important notes

- Camera capture requires a secure context (`https`) or `localhost`.
- Desktop uses the system default camera; mobile uses the device default camera (typically rear-facing).

## Troubleshooting

- If a device receives nothing:
	- Check server log for `Client connected`
	- Ensure both devices are connected to the same server URL
	- Verify browser permissions for camera access
	- Use Chrome on Android or Safari on iOS

## Teaching tip

This repo is intentionally small so students can easily modify:

- the frame size and JPEG quality in `sendCameraFrameIfDue()` in each sketch
- the overlay position and size in `drawRemoteFrameOverlay()`
- the relay logic in `server.js`
