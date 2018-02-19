'use strict';
class RoadLine {
  constructor(position) {
    this.position = position;
    this.length = 2.0 + this.position / 100.0 * 16;
    this.color = 'rgba(150, 150, 0, 0.4)';
  }

  advance(alpha) {
    this.position += alpha * (0.1 + this.position * 1.005 - this.position);
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
    this.roadLines = [new RoadLine(2),
                      new RoadLine(9),
                      new RoadLine(18),
                      new RoadLine(32),
                      new RoadLine(53),
                      new RoadLine(79)];

    this.canvas = canvas;
    this.context = context;
  }

  render(milesPerHour) {
    // Easy way to erase all lines rendered on screen.
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.roadLines.forEach(roadLine =>
      roadLine.render(this.canvas, this.context));
    this.roadLines.forEach(roadLine =>
      roadLine.advance(milesPerHour / 12.0));
    // Some hacky shit to make the road lines not catch up to each other.
    if (this.roadLines[this.roadLines.length - 1].position > 100.0)
      this.roadLines.pop();
    if (this.roadLines[0].position > 9.0)
      this.roadLines.unshift(new RoadLine(2));
    requestAnimationFrame(() => this.render(milesPerHour));
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
    const aspect = canvas.width * 1.0 / canvas.height;

    $('#title').css({
      top: canvas.height * 0.005 * aspect,
      left: canvas.width * 0.0075,
      'font-size': canvas.width * 0.025
    });

    $('#subtitle').css({
      'font-size': canvas.width * 0.0085,
      'margin-top': -canvas.height * 0.01
    });
  }

  $(window).resize(resizeCanvas);
  resizeCanvas(); // Once on load.
  const road = new Road(canvas, context);
  road.render(10.0);
});
