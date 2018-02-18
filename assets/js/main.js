class RoadLine {
  constructor(position) {
    this.position = position % 100.0;
    this.length = 2.0 + this.position / 100.0 * 16;
    this.color = 'rgba(150, 150, 0, 0.4)';
  }

  advanceTick() {
    this.position = (0.1 + this.position * 1.005) % 100.0;
    this.length = 2.0 + this.position / 100.0 * 16;
  }

  flicker(newColor, time) {
    const oldColor = this.color;
    this.color = newColor;
    setTimeout(() => this.color = oldColor, time);
  }

  render(canvas, context) {
    const rP = this.position;
    const rhP = this.length;

    const pMid = 50.05;
    const wTop = 49.95;
    const wBot = 49.41;
    const hTop = 62.31;
    const hBot = 100.0;

    const dW = wBot - wTop;
    const dH = hBot - hTop;

    const xP = wTop + rP / 100.0 * dW;
    const yP = hTop + rP / 100.0 * dH;
    const wP = (pMid - xP) * 2.0;

    const xbP = wTop + (rP + rhP) / 100.0 * dW
    const ybP = hTop + (rP + rhP) / 100.0 * dH
    const wbP = (pMid - xbP) * 2.0;

    const x = xP / 100.0 * canvas.width;
    const y = yP / 100.0 * canvas.height;
    const w = wP / 100.0 * canvas.width;

    const xb = xbP / 100.0 * canvas.width;
    const yb = ybP / 100.0 * canvas.height;
    const wb = wbP / 100.0 * canvas.width;

    // Explicitly set color each time.
    context.fillStyle = this.color;

    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + w, y);
    context.lineTo(xb + wb, yb);
    context.lineTo(xb, yb);
    context.closePath();
    context.fill();
  }
}

class Road {
  constructor(canvas, context) {
    this.renderLoop = setInterval(() => null);
    this.roadLines = [new RoadLine(1),
                      new RoadLine(5),
                      new RoadLine(15),
                      new RoadLine(24),
                      new RoadLine(37),
                      new RoadLine(50)];

    this.canvas = canvas;
    this.context = context;
  }

  runAtSpeed(milesPerHour) {
    clearInterval(this.renderLoop);
    this.renderLoop = setInterval(() => {
      // Easy way to erase all lines rendered on screen.
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.roadLines.forEach(roadLine =>
        roadLine.render(this.canvas, this.context));
      this.roadLines.forEach(roadLine => roadLine.advanceTick());
    }, 1.0 / (milesPerHour * milesPerHour) * 8000.0);
  }

  flickerRandom(color, time) {
    const randomLine = this.roadLines[Math.floor(Math.random()
      * this.roadLines.length)];
    randomLine.flicker(color, time);
  }
}

$(document).ready(() => {
  const canvas = $('#game')[0];
  const context = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  $(window).resize(resizeCanvas);
  resizeCanvas(); // Once on load.
  const road = new Road(canvas, context);
  road.runAtSpeed(30.0);
});
