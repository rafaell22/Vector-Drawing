export default {
  template: `
      <div class='canvas'>
          <div class="ui">
              <div class="zoom">
                  <div class="zoom-in"><span>+</span></div>
                  <div class="zoom-out"><span>-</span></div>
              </div>
          </div>
          <canvas class="viewport"></canvas>
      </div>
  `,
  styles: `
    .canvas canvas {
      border: 1px solid black;
      padding: 0; 
      margin: 0;
    }
    
    .ui {
      z-index: 1000;
    }
    
    .ui .zoom {
      position:absolute;
      right: 30px;
      bottom: 100px;
    }
    
    .ui .zoom .zoom-in, .ui .zoom .zoom-out {
      width: 50px;
      height: 50px;
      background-color: white;
      border: 1px solid black;
      position: relative;
    }
    
    .ui .zoom .zoom-in {
      cursor: zoom-in;
    }
    
    .ui .zoom .zoom-out {
      cursor: zoom-out;
    }
    
    .ui .zoom .zoom-in span, .ui .zoom .zoom-out span {
      font-size: 36px;
      font-weight: bold;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  `,
  data: {
      viewportCanvas: null,
      viewportContext: null,
      viewport: { x: 0, y: 0 },
      auxLinesCanvas: null,
      auxLinesContect: null,
      ZOOM_FACTOR: 0.5,
      UPSCALE_FACTOR: 10,
      size: { width: 48, height: 48 },
      zoom: 1,
      imageCache: [
        'woodTable'
      ],
      jsonCache: [],
      cache: {
          images: [],
          jsons: []
      },
      isRunning: false,
      maxFps: 60,
      timestep: 1000 / 30,
      lastFrameTimeMs: 0,
      delta: 0,
      fps: 60,
      framesThisSecond: 0,
      lastFpsUpdate: 0,
      hasStarted: false,
      frameId: 0,
      background: {},
      paths: [],
      hasChange: true,
  },
  setup: function() {},
  mounted: async function() {
    try {
      await this.start();
    } catch (errorStarting) {
      console.error('Error running Initialize function: ');
      console.error(errorStarting);
    }
    
    this.app.$pubSub.subscribe('store.drawing.addStep', (function() {
      const steps = this.app.$stores.drawing.getters.steps;
      this.paths.push(steps[steps.length - 1]);
      this.hasChange = true;
    }).bind(this));
    
    this.app.$pubSub.subscribe('store.drawing.updateStep', (function() {
      const steps = this.app.$stores.drawing.getters.steps;
      this.paths.push(steps[steps.length - 1]);
      this.hasChange = true;
    }).bind(this));
  },
  methods: {
      panic: function() {
          this.delta = 0;
      },
      __loop:  function(timestamp) {
        if (this.isRunning) {
        // Throttle the frame rate.
        if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFps)) {
          this.frameId = requestAnimationFrame(this.__loop.bind(this));
          return;
        }
        this.delta += timestamp - this.lastFrameTimeMs;
        this.lastFrameTimeMs = timestamp;

        if (timestamp > this.lastFpsUpdate + 1000) {
          this.fps = 0.25 * this.framesThisSecond + 0.75 * this.fps;

          this.lastFpsUpdate = timestamp;
          this.framesThisSecond = 0;
        }
        this.framesThisSecond++;

        let numUpdateSteps = 0;
        while (this.delta >= this.timestep) {
          this.update(this.timestep);
          this.delta -= this.timestep;
          if (++numUpdateSteps >= 240) {
            this.panic();
            break;
          }
        }

        this.draw(this.delta / this.timestep);
        this.frameId = requestAnimationFrame(this.__loop.bind(this));
      }
    },
    start: async function() {
      if (!this.hasStarted) {
        this.hasStarted = true;
        console.log('Loading data...');
        try {
          await Promise.all([this.loadImages(this.imageCache), this.loadJsons(this.jsonCache)]);
        } catch (errorLoadingCache) {
          console.error('App - start - error: ');
          console.error(errorLoadingCache);
          return;
        }
        console.log('Done!');

        this.initialize();
        this.frameId = requestAnimationFrame((function(timestamp) {
          this.draw(1);
          this.isRunning = true;
          this.lastFrameTimeMs = timestamp;
          this.lastFpsUpdate = timestamp;
          this.framesThisSecond = 0;
          this.frameId = requestAnimationFrame(this.__loop.bind(this));
        }).bind(this));
      }
    },
    stop: function() {
      this.isRunning = false;
      this.hasStarted = false;
      cancelAnimationFrame(this.frameId);
    },
    loadImage: function(src) {
      return new Promise((resolve, reject) => {
        const elImage = document.createElement('IMG');
        elImage.addEventListener('load', function() {
          resolve(elImage);
        });
        elImage.src = `../../images/${src}.png`;
      });
    },
    loadImages: async function(sources) {
      for(let sourceIndex = (sources.length - 1); sourceIndex > -1; sourceIndex--) {
        this.cache.images[sources[sourceIndex]] = await this.loadImage(sources[sourceIndex]);
      }
    },
    loadJson: function(url) {
      return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.onreadystatechange = function() {
          // if DONE and SUCCESS
          if ((request.readyState == 4) && (request.status == 200)) {
            resolve(JSON.parse(request.responseText));
          }
        }
        request.open("GET", url + ".json", true);
        request.onError = function(event) { 
          console.log('ERROR!')
          throw new Error(event); 
        };
        request.send();
      });
    },
    loadJsons: async function(urls) {
      for(let urlIndex = (urls.length - 1); urlIndex > -1; urlIndex--) {
        this.cache.jsons[urls[urlIndex]] = await this.loadJson(urls[urlIndex]);
      }
    },
    copyTouch: function({ identifier, pageX, pageY }) {
      return { identifier, pageX, pageY };
    },
    ongoingTouchIndexById: function(ongoingTouch, touches) {
      for (let i = 0; i < touches.length; i++) {
        let id = touches[i].identifier;

        if (id == ongoingTouch.identifier) {
          return i;
        }
      }
      return -1;    // not found
    },
    canvasTouchStart: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      this.prevTouch = this.copyTouch(touches[0]);
    },
    canvasTouchMove: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      
      const idx = this.ongoingTouchIndexById(this.prevTouch, touches);

      if (idx >= 0) {        
        const dX = this.prevTouch.pageX - touches[idx].pageX;
        const dY = this.prevTouch.pageY - touches[idx].pageY;

        this.viewport.x += dX * 0.9;
        this.viewport.y += dY * 0.9;

        this.prevTouch = this.copyTouch(touches[idx]);  // swap in the new touch record
      } else {
        console.log("can't figure out which touch to continue");
      }
    },
    canvasTouchEnd: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      const idx = this.ongoingTouchIndexById(this.prevTouch, touches);
      if (idx >= 0) {
        this.prevTouch = {};
      } else {
        console.log("can't figure out which touch to continue");
      }
    },
    canvasTouchCancel: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      const idx = this.ongoingTouchIndexById(this.prevTouch, touches);
      if (idx >= 0) {
        this.prevTouch = {};
      } else {
        console.log("can't figure out which touch to continue");
      }
    },
    zoomIn: function(event) {
      this.zoom *= this.ZOOM_FACTOR;
    },
    zoomOut: function(event) {
        if(this.zoom >= 2) return;
        this.zoom /= this.ZOOM_FACTOR;
    },
    drawImageBorder: function(canvas, context) {
        context.beginPath();
        context.setLineDash([10, 10]);
        context.moveTo(0,  0);
        context.lineTo(canvas.width, 0);
        context.lineTo(canvas.width, canvas.height);
        context.lineTo(0, canvas.height);
        context.lineTo(0,  0);
        context.stroke();
    },
    initialize: function() {
      console.log('Initializing canvas...');
      this.canvas = document.createElement('CANVAS');
      this.context = this.canvas.getContext('2d');
      this.context.imageSmoothingEnabled = false;
      this.canvas.width = this.size.width * this.UPSCALE_FACTOR;
      this.canvas.height = this.size.height * this.UPSCALE_FACTOR;

      this.auxLinesCanvas = document.createElement('CANVAS');
      this.auxLinesContext = this.auxLinesCanvas.getContext('2d');
      this.auxLinesContext.imageSmoothingEnabled = false;
      this.auxLinesCanvas.width = (this.size.width + 2) * this.UPSCALE_FACTOR;
      this.auxLinesCanvas.height = (this.size.height + 2) * this.UPSCALE_FACTOR;

      this.viewportCanvas = this.rootElement.querySelector('.viewport');
      this.viewportContext = this.viewportCanvas.getContext('2d');
      this.viewportContext.imageSmoothingEnabled = false;
      this.viewportCanvas.width = window.innerWidth;
      this.viewportCanvas.height = window.innerHeight - 78;
      
      //adding event listeners
      console.log('Adding touch event listeners...');
      this.prevTouch = {};
      this.viewportCanvas.addEventListener('touchstart', this.canvasTouchStart.bind(this));
      this.viewportCanvas.addEventListener('touchmove', this.canvasTouchMove.bind(this));
      this.viewportCanvas.addEventListener('touchend', this.canvasTouchEnd.bind(this));
      
      this.rootElement.querySelector('.zoom-in').addEventListener('click', this.zoomIn.bind(this));
      this.rootElement.querySelector('.zoom-out').addEventListener('click', this.zoomOut.bind(this));
      console.log('Done!');

      this.draw(this.context);
    },
    update: function() {},
    draw: function() {
      if (this.hasChange) {
        this.hasChange = false;
        this.context.clear();
        
        this.paths.forEach((path) => {
          this.context.stroke(new Path2D(path))
        });
        
        // Draw something on the board
        this.background = {
          img: {
            src: this.cache.images['woodTable'],
            x: 0,
            y: 0,
            w: 1000,
            h: 1000
          }
        }
        // this.context.drawImage(this.background.img.src, this.background.img.x, this.background.img.y, this.background.img.w, this.background.img.h);
      }
      
      this.viewportContext.clear();
      
      // draw the image limits on the aux canvas
      this.drawImageBorder(this.auxLinesCanvas, this.auxLinesContext);
      
      // draw the image limits on the viewport
      this.viewportContext.drawImage(this.auxLinesCanvas,  this.viewport.x, this.viewport.y, this.auxLinesCanvas.width * this.zoom, this.auxLinesCanvas.height * this.zoom, -1, -1, this.auxLinesCanvas.width * (this.viewportCanvas.height / this.auxLinesCanvas.height), this.auxLinesCanvas.height * (this.viewportCanvas.height / this.auxLinesCanvas.height));
      
      // draw the image
      this.viewportContext.drawImage(this.canvas,  this.viewport.x, this.viewport.y, this.canvas.width * this.zoom, this.canvas.height * this.zoom, 0, 0, this.canvas.width * (this.viewportCanvas.height / this.canvas.height), this.canvas.height * (this.viewportCanvas.height / this.canvas.height));
    },
    end: function(fps, panic) {
        if (panic) {
          // This pattern introduces non-deterministic behavior, but in this case
          // it's better than the alternative (the application would look like it
          // was running very quickly until the simulation caught up to real
          // time). See the documentation for `MainLoop.setEnd()` for additional
          // explanation.
          const discardedTime = Math.round(this.resetFrameDelta());
          console.warn('Main loop panicked, probably because the browser tab was put in the background. Discarding ' + discardedTime + 'ms');
        }
    },
  },
};