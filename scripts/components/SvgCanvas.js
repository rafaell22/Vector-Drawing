export default {
  template: `
      <div class='svg-canvas'>
          <div class="ui">
              <div class="zoom">
                  <div class="zoom-in"><span>+</span></div>
                  <div class="zoom-out"><span>-</span></div>
              </div>
          </div>
      </div>
  `,
  styles: `
    .svg-canvas {
        position: relative;
    }
    
    .svg-canvas svg {
      border: 1px solid black;
      padding: 0; 
      margin: 0;
    }
    
    .svg-canvas .ui {
      z-index: 1000;
    }
    
    .svg-canvas .ui .zoom {
      position:absolute;
      right: 30px;
      bottom: 100px;
    }
    
    .svg-canvas .ui .zoom .zoom-in, .ui .zoom .zoom-out {
      width: 50px;
      height: 50px;
      background-color: white;
      border: 1px solid black;
      position: relative;
    }
    
    .svg-canvas .ui .zoom .zoom-in {
      cursor: zoom-in;
    }
    
    .svg-canvas .ui .zoom .zoom-out {
      cursor: zoom-out;
    }
    
    .svg-canvas .ui .zoom .zoom-in span, .ui .zoom .zoom-out span {
      font-size: 36px;
      font-weight: bold;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  `,
  data: {
      // How much the zoom changes when the user clicks the zoom button
      ZOOM_FACTOR: 0.5,
      // Movement modifier for the the touch movement. 
      // Basically, how much a user needs to move their finger to move the same amount of canvas pixels
      TOUCH_MOVE_MODIFIER: 0.1,
      XMLNS: 'http://www.w3.org/2000/svg',
      // border around the image, width in pixels
      BORDER_WIDTH: 1,
      INITIAL_VIEW_MARGIN: 10,
      viewport: { x: 0, y: 0, width: 0, height: 0 },
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
      svgElement: null,
      svgCrosshairs: null,
      background: {},
      paths: [],
  },
  setup: function() {},
  mounted: async function() {
    console.log('Initializing svg...');
    // Calculate the viewport based on the image size
    this.viewport.x = this.viewport.x - this.BORDER_WIDTH - this.INITIAL_VIEW_MARGIN / 2;
    this.viewport.y = this.viewport.y - this.BORDER_WIDTH;
    this.viewport.width = this.size.width + 2 * this.BORDER_WIDTH + this.INITIAL_VIEW_MARGIN;
    this.viewport.height = this.size.height + 2 * this.BORDER_WIDTH;
    
    // create root svg
    this.svgElement = this.createMainSvgElement();
    
    // create the image borders
    this.svgElement.appendChild(this.createImageBorders());
   
    // create the image crosshairs
    this.svgCrosshairs = this.createImageCrosshairs();
    this.svgElement.appendChild(this.svgCrosshairs);
   
    this.rootElement.querySelector('.svg-canvas').appendChild(this.svgElement);
    
    this.addEventListeners();
  },
  methods: {
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
    svgTouchStart: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      this.prevTouch = this.copyTouch(touches[0]);
    },
    svgTouchMove: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      
      const idx = this.ongoingTouchIndexById(this.prevTouch, touches);

      if (idx >= 0) {        
        const dX = this.prevTouch.pageX - touches[idx].pageX;
        const dY = this.prevTouch.pageY - touches[idx].pageY;

        // For this app, the bigger the perceived zoom is inversely proportional to the zoom value.
        // That means bigger zoom values mean the user see the image smaller and vice-versa.
        // The zoom is applied to the touch movement because we want the user to move "more" the more they are zoomed out (as the convas is showing more and more pixels)
        this.viewport.x += dX * this.TOUCH_MOVE_MODIFIER * this.zoom;
        this.viewport.y += dY * this.TOUCH_MOVE_MODIFIER * this.zoom;

        this.svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width * this.zoom} ${this.viewport.height * this.zoom}`);

        this.prevTouch = this.copyTouch(touches[idx]);  // swap in the new touch record
      } else {
        console.log("can't figure out which touch to continue");
      }
    },
    svgTouchEnd: function(event) {
      event.preventDefault();
      const touches = event.changedTouches;
      const idx = this.ongoingTouchIndexById(this.prevTouch, touches);
      if (idx >= 0) {
        this.prevTouch = {};
      } else {
        console.log("can't figure out which touch to continue");
      }
    },
    svgTouchCancel: function(event) {
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
      this.svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width * this.zoom} ${this.viewport.height * this.zoom}`);
    },
    zoomOut: function(event) {
        // if(this.zoom >= 2) return;
        this.zoom /= this.ZOOM_FACTOR;
        this.svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width * this.zoom} ${this.viewport.height * this.zoom}`);
    },
    createMainSvgElement: function() {
        // create the main svg element
        const svgElement = document.createElementNS(this.XMLNS, 'svg');
        svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width} ${this.viewport.height}`);
        svgElement.setAttributeNS(null, 'width', window.innerWidth);
        svgElement.setAttributeNS(null, 'height', window.innerHeight); // - 140);
        svgElement.style.backgroundColor = '#dddddd';
        
        return svgElement;
    },
    createImageBorders: function() {
        const g = document.createElementNS(this.XMLNS, 'g');
        const imageBorders = `
          M -${this.BORDER_WIDTH} -${this.BORDER_WIDTH} 
          h ${this.size.width + 2 * this.BORDER_WIDTH} 
          v ${this.size.height + 2 * this.BORDER_WIDTH} 
          h -${this.size.width + 2 * this.BORDER_WIDTH} 
          Z`;
        const path = document.createElementNS(this.XMLNS, 'path');
        path.setAttributeNS(null, 'stroke', '#000000');
        path.setAttributeNS(null, 'stroke-width', this.BORDER_WIDTH);
        path.setAttributeNS(null, 'stroke-dasharray', '5,5');
        path.setAttributeNS(null, 'd', imageBorders);
        path.setAttributeNS(null, 'opacity', 1.0);
        path.setAttributeNS(null, 'fill', '#ffffff');
        g.appendChild(path);
        
        return g;
    },
    createImageCrosshairs: function() {
        const g = document.createElementNS(this.XMLNS, 'g');
        const crosshairs = `
          m -2 -2
          l 4 4
          m -4 0
          l 4 -4
          `;
        const path = document.createElementNS(this.XMLNS, 'path');
        path.setAttributeNS(null, 'stroke', '#ff0000');
        path.setAttributeNS(null, 'stroke-width', 1);
        path.setAttributeNS(null, 'd', crosshairs);
        path.setAttributeNS(null, 'opacity', 1.0);
        g.appendChild(path);
        
        return g;
    },
    addEventListeners: function() {
         //adding event listeners
        console.log('Adding event listeners...');
        this.prevTouch = {};
        this.svgElement.addEventListener('touchstart', this.svgTouchStart.bind(this));
        this.svgElement.addEventListener('touchmove', this.svgTouchMove.bind(this));
        this.svgElement.addEventListener('touchend', this.svgTouchEnd.bind(this));
        this.svgElement.addEventListener('touchcancel', this.svgTouchCancel.bind(this));
    
        this.rootElement.querySelector('.zoom-in').addEventListener('click', this.zoomIn.bind(this));
        this.rootElement.querySelector('.zoom-out').addEventListener('click', this.zoomOut.bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.addStep', (function() {
          const steps = this.app.$stores.drawing.getters.steps;
          const lastStep = steps[steps.length - 1];
          this.paths.push(lastStep);
          const newPath = this.addNewPath(lastStep);
          this.svgElement.appendChild(newPath);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.updateStep', (function() {
          const steps = this.app.$stores.drawing.getters.steps;
          const lastStep = steps[steps.length - 1];
          this.paths.push(steps[lastStep]);
          this.updatePath(lastStep);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.setCrosshais', (function() {
            const crosshairsPosition = this.app.$stores.drawing.getters.crosshairs;
            this.svgCrosshairs.setAttributeNS(null, 'transform', `translate(${crosshairsPosition.x} ${crosshairsPosition})`);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.updateCrosshais', (function() {
            
        }).bind(this));
        console.log('Done!');
    },
    addNewPath: function(step) {
        // create the main svg element
        const elPath = document.createElementNS(this.XMLNS, 'path');
        elPath.setAttributeNS(null, 'stroke', step.stroke.color);
        elPath.setAttributeNS(null, 'stroke-width', step.stroke.width);
        elPath.setAttributeNS(null, 'd', step.path);
        elPath.setAttributeNS(null, 'opacity', 1.0);
        if (step.fill === 'none') {
          elPath.setAttributeNS(null, 'fill', 'none');
        } else {
          elPath.setAttributeNS(null, 'fill', step.fill.color);
        }

        return elPath;
    },
    updatePath: function(step) {
        // create the main svg element
        const children = this.svgElement.children;
        const lastPath = children[children.length - 1];
        lastPath.setAttributeNS(null, 'stroke', step.stroke.color);
        lastPath.setAttributeNS(null, 'stroke-width', step.stroke.width);
        lastPath.setAttributeNS(null, 'd', step.path);
        lastPath.setAttributeNS(null, 'opacity', 1.0);
        if (step.fill === 'none') {
          lastPath.setAttributeNS(null, 'fill', 'none');
        } else {
          lastPath.setAttributeNS(null, 'fill', step.fill.color);
        }
    },
  },
};