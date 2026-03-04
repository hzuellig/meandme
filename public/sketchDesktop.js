let socket;
let sensor = { alpha: 0, beta: 0, gamma: 0 };
let pg;
let orient = { yaw: 0, pitch: 0, roll: 0 };

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pg = createGraphics(width, height, WEBGL);
  pg.setAttributes({ alpha: true });

  // Connect to the WebSocket server
  socket = io();

  socket.on("sensorData", (data) => {
    sensor = {
      alpha: Number.isFinite(data?.alpha) ? data.alpha : 0,
      beta: Number.isFinite(data?.beta) ? data.beta : 0,
      gamma: Number.isFinite(data?.gamma) ? data.gamma : 0
    };
    console.log("received sensor data from mobile:", data);
  });
}

function draw() {
  /*background(20);
  fill(255);
  ellipse(width/2, height/2, map(sensor.beta, -90, 90, 10, 300));
*/


  // trick transparent background with webgl https://editor.p5js.org/micuat/sketches/qOAjrWJf9
  pg.background(0, 20)
  // Use orthogonal projection to avoid perspective distortion (optional)
  pg.ortho(-200, 200, -200, 200, 0.1, 1000);

  pg.camera(320, -240, 420,
    0, 0, 0,     // Look at the origin
    0, 1, 0);    // Y-axis points upwards (keep the camera upright)

  drawAxis(pg);

  pg.stroke(255);
  pg.noFill();
  pg.push();

  const targetYaw = radians(sensor.alpha);
  const targetPitch = radians(sensor.beta);
  const targetRoll = radians(sensor.gamma);

  //make it smooth
  orient.yaw = lerpAngle(orient.yaw, targetYaw, 0.2);
  orient.pitch = lerp(orient.pitch, targetPitch, 0.2);
  orient.roll = lerp(orient.roll, targetRoll, 0.2);

  pg.rotateY(orient.yaw);
  pg.rotateX(orient.pitch);
  pg.rotateZ(-orient.roll);

  
  pg.box(100, 5, 200);

  pg.pop();

  image(pg, -width / 2, -height / 2);

}

function lerpAngle(current, target, amount) {
  let delta = target - current;
  while (delta > PI) delta -= TWO_PI;
  while (delta < -PI) delta += TWO_PI;
  return current + delta * amount;
}

function drawAxis(target) {
  /*
    p5 Axis
    ~~~
    X-axis: Positive X points to the right. red
    Y-axis: Positive Y points downwards (towards the bottom of the screen). green
    Z-axis: Positive Z points towards the viewer (out of the screen). blue
  */
  // X-axis (Red)
  target.push();
  target.strokeWeight(2);

  target.stroke(255, 0, 0);
  target.line(0, 0, 0, 200, 0, 0);  // X axis points right

  // Y-axis (Green)
  target.stroke(0, 255, 0);
  target.line(0, 0, 0, 0, -200, 0);  // Y axis points upwards

  // Z-axis (Blue)
  target.stroke(0, 0, 255);
  target.line(0, 0, 0, 0, 0, 200);  // Z axis points towards the viewer

  target.pop();
}