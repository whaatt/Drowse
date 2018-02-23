'use strict';
class RoadLine {
  constructor(position) {
    this.position = position;
    this.length = 2.0 + this.position / 100.0 * 16;
    this.color = 'rgba(255, 255, 0, 0.4)';
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
                      new RoadLine(52),
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
      if (index < this.messages.length) {
        setTimeout(() => {
          if (this.doStop)
            return;

          if (this.doType) {
            // Hide all the children elements, showing them one-by-one.
            DOM.call.html(this.messages[index]).children('.type').hide();
            const children = DOM.call.children('.type');

            const childrenPlayer = (childIndex) => {
              if (childIndex < children.length) {
                let text = children.eq(childIndex).html();
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
            };

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
              const flickerColor = 'white';
              DOM.road.flickerRandom(flickerColor, this.flickerTime);
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
                          flickers.toString() + '</span> changes. Your ' +
                          'mistake rate was <span class="yours">' + error +
                          '%</span>. <a href="javascript: void(0);" ' +
                          'class="next button">Continue.</a></span>');
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

    // Jank non-functional code that we have to specify class names...
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
          .off('click')
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
          .off('click')
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

  let soundLoaded = false;
  const processSoundLoaded = (force) => {
    if (!force && !soundLoaded) return;
    soundLoaded = true;
    $('.load')
      .click(() => sound.play('seamless'))
      .attr('href', 'javascript: void(0);')
      .removeClass('load')
      .addClass('next');
  };

  const sound = new Howl({
    src: ['assets/audio/ambient.mp3'],
    html5: true,
    volume: 1.0,
    onload: () => processSoundLoaded(true),
    sprite: { seamless: [3000, 154000, true] }
  });

  // Call loadedSound when we navigate back.
  $('body').on('DOMNodeInserted', (e) => {
    if ($(e.target).hasClass('load'))
      processSoundLoaded();
  });

  // Option to start playing without sound.
  $(document).on('click', '.quiet', () => sound.stop());

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

  // TODO: Maybe edit this if there is something better.
  const tweetContent = "https://drowse.ml: A matter of life or death.";

  new Player([
    new Message([
      '<a href="javascript: void(0);" class="next button quiet">' +
        'Start' +
      '</a> or ' +
      '<a class="load button sound">' +
        'Start With Sound' +
      '</a>'
    ], 0, false, 0),
    new Message([
      '<span class="type">' +
        'Commercial drivers make an average of 160 decisions per mile.' +
      '</span>',
      '<span class="type">' +
        'Now it\'s your turn...' +
      '</span>',
      '<span class="type">' +
        'Your car will move when you press Continue.' +
      '</span>',
      '<span class="type">' +
        'Click the screen every time a road line changes ' +
      '</span>' +
      '<span class="type effect">' +
        'color' +
      '</span>' +
      '<span class="type">' +
        '.' +
      '</span>',
      '<span class="type">' +
        'You can also hit the spacebar.' +
      '</span>',
      '<a href="javascript: void(0);" class="next button">' +
        'Continue.' +
      '</span>'
    ], 1500, true, 16),
    new Game(10, 30.0, 0.0, 0.0, 250, 550, 200),
    new Message([
      '<span class="type">' +
        'Pretty easy, right?' +
      '</span>',
      '<span class="type">' +
        'With enough concentration, driving isn\'t hard.' +
      '</span>',
      '<span class="type">' +
        'We do it every day.' +
      '</span>',
      '<span class="type">' +
        'But some days, we stay up later than usual...' +
      '</span>',
      '<span class="type">' +
        'And the next morning, we feel a little ' +
      '</span>' +
      '<a href="javascript: void(0);" class="next type button">' +
        'drowsier' +
      '</a>' +
      '<span class="type">' +
        ' than usual...' +
      '</span>'
    ], 1500, true, 16),
    new Game(10, 30.0, 0.0, 0.13, 250, 550, 200),
    new Message([
      '<span class="type">' +
        'You just microslept.' +
      '</span>',
      '<span class="type">' +
        'Microsleeps are caused by sleep deprivation...' +
      '</span>',
      '<span class="type">' +
        '...and last anywhere from 1 to 30 seconds.' +
      '</span>',
      '<span class="type">' +
        'You might not even realize it.' +
      '</span>',
      '<span class="type">' +
        'But what you see here is precisely what happens.' +
      '</span>',
      '<span class="type">' +
        'Now add some ' +
      '</span>' +
      '<a href="javascript: void(0);" class="next type button">' +
        'speed' +
      '</a>' +
      '<span class="type">' +
        ' into the mix.' +
      '</span>'
    ], 1500, true, 16),
    new Game(10, 60.0, 0.0, 0.13, 250, 400, 200),
    new Message([
      '<span class="type">' +
        '2.5% of fatal crashes in the US involve drowsy driving.' +
      '</span>',
      '<span class="type">' +
        'That\'s 800 deaths, not to mention the 44000 other injuries.' +
      '</span>',
      '<span class="type">' +
        'And it\'s all completely preventable.' +
      '</span>',
      '<span class="type">' +
        'The science is clear.' +
      '</span>',
      '<span class="type">' +
        'Accidents happen with a microsleep probability as low as 10%.' +
      '</span>',
      '<span class="type">' +
        'If you\'re really sleepy, that can climb to over 50%.' +
      '</span>',
      '<span class="type">' +
        'And then accidents become a certainty.' +
      '</span>',
      '<span class="type">' +
        'Give ' +
      '</span>' +
      '<a href="javascript: void(0);" class="next type button">' +
        'THAT' +
      '</a>' +
      '<span class="type">' +
        ' a shot...' +
      '</span>'
    ], 1500, true, 16),
    new Game(10, 60.0, 0.0, 0.9, 250, 400, 200),
    new Message([
      '<span class="type">' +
        'So here\'s the deal.' +
      '</span>',
      '<span class="type">' +
        'Drowsy driving is drunk driving.' +
      '</span>',
      '<span class="type">' +
        'Statistically, it might be worse.' +
      '</span>',
      '<span class="type">' +
        'When you drive without sleep, you\'re putting yourself at risk.' +
      '</span>',
      '<span class="type">' +
        'You\'re putting your passengers at risk.' +
      '</span>',
      '<span class="type">' +
        'You\'re putting pedestrians at risk.' +
      '</span>',
      '<span class="type">' +
        'You\'re putting other drivers at risk.' +
      '</span>',
      '<span class="type">' +
        'Don\'t ****ing do it.' +
      '</span>',
      '<a href="http://twitter.com/intent/tweet?text=' + tweetContent +
        '" onclick="window.open(this.href, \'twitter\', ' +
        '\'left=20,top=20,width=600,height=300,toolbar=0,resizable=1\'); ' +
        'return false;" class="button" target="_blank">' +
        'Tweet This' +
      '</a> or ' +
      '<a href="credits.txt" class="button" target="_blank">' +
        'View Credits' +
      '</a>'
    ], 1500, true, 16)
  ], DOM).start();
});
