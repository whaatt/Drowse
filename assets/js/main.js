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

    const xbP = wTop + (rP + rhP) / 100.0 * dW;
    const ybP = hTop + (rP + rhP) / 100.0 * dH;
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
    this.rendering = false;
    this.roadLines = [new RoadLine(2),
                      new RoadLine(9),
                      new RoadLine(18),
                      new RoadLine(32),
                      new RoadLine(53),
                      new RoadLine(79)];

    this.canvas = canvas;
    this.context = context;
  }

  move(milesPerHour) {
    this.milesPerHour = milesPerHour;
    if (!this.rendering) {
      this.rendering = true;
      this.render();
    }
  }

  render() {
    // Easy way to erase all lines rendered on screen.
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.roadLines.forEach(roadLine =>
      roadLine.render(this.canvas, this.context));
    this.roadLines.forEach(roadLine =>
      roadLine.advance(this.milesPerHour / 12.0));
    // Some hacky shit to make the road lines not catch up to each other.
    if (this.roadLines[this.roadLines.length - 1].position > 100.0)
      this.roadLines.pop();
    if (this.roadLines[0].position > 9.0)
      this.roadLines.unshift(new RoadLine(2));
    requestAnimationFrame(() => this.render());
  }

  flickerRandom(color, time) {
    const randomLine = this.roadLines[Math.floor(Math.random()
      * this.roadLines.length)];
    randomLine.flicker(color, time);
  }
}

class Message /* implements Playable */ {
  constructor(messages, delay, doType, typeDelay) {
    this.messages = messages;
    this.delay = delay;
    this.doType = doType;
    this.typeDelay = typeDelay;
  }

  start(DOM) {
    this.doStop = false;
    DOM.stats.hide();
    const messagePlayer = (index) => {
      if (this.doStop)
        return;
      if (index < this.messages.length) {
        setTimeout(() => {
          if (this.doType) {
            // Hide all the children elements, showing them one-by-one.
            DOM.call.html(this.messages[index]).children('.type').hide();
            const children = DOM.call.children('.type');
            const childrenPlayer = (childIndex) => {
              if (this.doStop)
                return;
              if (childIndex < children.length) {
                const text = children.eq(childIndex).html();
                children.eq(childIndex).html('').show()
                  .on('end_type.typist', () => {
                    children.eq(childIndex).off('end_type.typist');
                    childrenPlayer(childIndex + 1);
                  })
                  .typist({
                    text: text,
                    cursor: false,
                    speed: this.typeDelay
                  });
              } else {
                messagePlayer(index + 1);
              }
            }

            // Recursively type children.
            childrenPlayer(0);
          } else {
            DOM.call.html(this.messages[index]);
            messagePlayer(index + 1);
          }
        }, index === 0 ? 0 : this.delay);
      }
    };

    // Recursively play messages.
    messagePlayer(0);
  }

  stop(/* unused */ DOM) {
    this.doStop = true;
  }
}

class Game /* implements Playable */ {
  // TODO: Consider adding flicker color to the parameter list.
  constructor(time, speed, reset, probMSE, flickerTime, flickerDelay,
    flickerSpread) {
    this.time = time;
    this.speed = speed;
    this.reset = reset;
    this.probMSE = probMSE;

    this.flickerTime = flickerTime;
    this.flickerDelay = flickerDelay;
    this.flickerSpread = flickerSpread;
  }

  start(DOM) {
    this.doStop = false;
    DOM.call.html('');
    DOM.stats.show();
    DOM.road.move(0);
    DOM.time.html(this.time.toString());

    let hits = 0;
    let flickers = 0;
    let started = false;

    // Named spacebar handler.
    this.spaceHandler = (e) => {
      const spacebar = 32;
      switch (e.keyCode) {
        case spacebar:
          ++hits;
        break;
      }
    };

    // Named click handler.
    this.clickHandler = (e) => {
      e.preventDefault();
      ++hits;
    };

    const timer = (seconds) => {
      clearTimeout(this.timerDelay);
      this.timerDelay = setTimeout(() => {
        if (this.doStop)
          return;
        if (seconds >= 3) {
          if (!started) {
            started = true;
            DOM.call.html('');
            DOM.document.on('keydown', this.spaceHandler);
            DOM.document.on('click', this.clickHandler);

            const flicker = () => {
              clearTimeout(this.flickerLoop);
              const delay = this.flickerDelay
                + Math.random() * 2 * this.flickerSpread - this.flickerSpread;
              DOM.road.flickerRandom('rgba(150, 0, 0, 0.4)', this.flickerTime);
              this.flickerLoop = setTimeout(flicker, delay);
              ++flickers;
            };

            // Start flickering.
            flicker();

            // Start microsleep.
            DOM.screen.flicker({
              minOpacity: 0,
              maxOpacity: 0,
              transition: 800,
              delay: 600,
              probability: this.probMSE
            });
          }

          // Post-countdown; pre-finish.
          if (this.time >= seconds - 3) {
            DOM.road.move(this.speed);
            DOM.time.html((this.time - seconds + 3).toString());
          } else {
            this.stop(DOM);
            const error = +(Math.abs(hits * 1.0 / flickers - 1.0) * 100)
              .toFixed(2);
            DOM.call.html('There were <span class="actual">' +
                          flickers.toString() + '</span> color changes. ' +
                          'Your error rate was <span class="yours">' + error +
                          '%</span>. <a href="javascript: void(0);" ' +
                          'class="next">Continue.</a>');
          }
        } else {
          // Countdown in center area.
          DOM.call.html((3 - seconds).toString());
        }
        timer(seconds + 1);
      }, seconds > 0 ? 1000 : 0);
    };

    // Recursive timer.
    timer(0);
  }

  stop(/* unused */ DOM) {
    this.doStop = true;

    // Reset DOM state.
    DOM.road.move(this.reset);
    DOM.screen.flicker('stop');
    DOM.screen.stop(true, true).css({ opacity: 1 }); // Jank...
    DOM.document.off('keydown', this.spaceHandler);
    DOM.document.off('click', this.clickHandler);

    // Clear any timeouts.
    clearTimeout(this.timerDelay);
    clearTimeout(this.flickerLoop);
  }
}

class Player {
  constructor(playables, DOM) {
    if (playables.length === 0)
      throw new Error('no playables provided');
    this.playables = playables;
    this.index = -1;
    this.DOM = DOM;

    // Back button.
    this.DOM.less
      .attr('disabled', true)
      .css({ color: '#333333' })
      .hide();

    // Forward button.
    this.DOM.greater
      .attr('disabled', false)
      .css({ color: 'white' })
      .hide();

    this.DOM.document.on('click', '.previous', () => this.previous(true));
    this.DOM.document.on('click', '.next', () => this.next(true));

    this.arrowHandler = (e) => {
      const arrow = {left: 37, up: 38, right: 39, down: 40};
      switch (e.keyCode) {
        case arrow.left:
          this.previous(true);
        break;
        case arrow.right:
          this.next(true);
        break;
      }
    };

    // Case with one playable.
    this.next(false);
  }

  start() {
    this.playables[this.index].start(this.DOM);
  }

  stop() {
    this.playables[this.index].stop(this.DOM);
  }

  previous(auto) {
    if (this.index > 0) {
      if (auto)
        this.stop();
      --this.index;
      if (this.index == 0)
        this.DOM.less
          .off('click')
          .attr('disabled', true)
          .css({ color: '#333333' });
      if (this.index < this.playables.length - 1)
        this.DOM.greater
          .on('click', () => this.next(true))
          .attr('disabled', false)
          .css({ color: 'white' });
      if (auto)
        this.start();
    }
  }

  next(auto) {
    if (this.index < this.playables.length - 1) {
      if (auto)
        this.stop();
      ++this.index;
      if (this.index > 0)
        this.DOM.less
          .on('click', () => this.previous(true))
          .attr('disabled', false)
          .css({ color: 'white' });
      if (this.index == this.playables.length - 1) {
        this.DOM.greater
          .off('click')
          .attr('disabled', true)
          .css({ color: '#333333' })
          .show();
        this.DOM.less.show();
        const that = this;
        this.DOM.document.off('keydown', this.arrowHandler);
        this.DOM.document.on('keydown', this.arrowHandler);
      }

      if (auto)
        this.start();
    }
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
      top: (aspect * 0.3).toString() + '%',
      left: '0.75%',
      'font-size': canvas.width * 0.025
    });

    $('#subtitle').css({
      'font-size': canvas.width * 0.0085,
      'margin-top': '-7.5%'
    });

    $('#call').css({
      'font-size': canvas.width * 0.035
    });

    $('#less').css({
      bottom: (aspect * 0.5).toString() + '%',
      left: '0.75%',
      'font-size': canvas.width * 0.015
    });

    $('#greater').css({
      bottom: (aspect * 0.5).toString() + '%',
      right: '0.75%',
      'font-size': canvas.width * 0.015
    });

    $('#stats').css({
      top: (aspect * 0.5).toString() + '%',
      right: '0.75%',
      'font-size': canvas.width * 0.02
    });
  }

  const DOM = {
    document: $(document),
    road: new Road(canvas, context),
    screen: $('#content'),
    call: $('#call'),
    stats: $('#stats'),
    time: $('#time'),
    less: $('#less'),
    greater: $('#greater')
  };

  $(window).resize(resizeCanvas);
  resizeCanvas(); // Once on load.
  DOM.road.move(0.0);

  new Player([
    new Message([
      '<a href="javascript: void(0);" class="next">Click to start.</a>'
    ], 0, false, 0),
    new Game(20, 30.0, 0.0, 0.1, 250, 550, 200),
    new Message([
      '<span class="type">' +
        'Every year, millions of people die from drowsy driving.' +
      '</span>',
      '<span class="type">' +
        'Don\'t become yet another fatal statistic. Get some sleep.' +
      '</span>'
    ], 1000, true, 8)
  ], DOM).start();
});
