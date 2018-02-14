const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawTrapVert(rP, rhP) {
  pMid = 50.05;
  wTop = 49.95;
  wBot = 49.41;
  hTop = 62.31;
  hBot = 100.0;

  dW = wBot - wTop;
  dH = hBot - hTop;

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

  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + w, y);
  context.lineTo(xb + wb, yb);
  context.lineTo(xb, yb);
  context.closePath();
  context.fill();
}

$(document).ready(() => {
  $(window).resize(resizeCanvas);
  resizeCanvas(); // Once on load.

  let pos = 0;
  setInterval(function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(150, 150, 0, 0.4)'
    drawTrapVert(pos % 100.0, 2 + (pos % 100.0) / 100.0 * 16);
    pos += 0.1 + (pos % 100.0) / 100.0;
  }, 10);

  // drawTrapVert(16.5, 6);
  // drawTrapVert(24, 6);
  // drawTrapVert(34, 8);
  // drawTrapVert(48, 12);
  // drawTrapVert(68, 14);
});
