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
      pathsGroupElement: null,
      svgCrosshairs: null,
      svgBorders: null,
      background: {},
      paths: [],
  },
  setup: function() {},
  mounted: function() {
    console.log('Initializing svg...');
    // create root svg
    this.svgElement = this.createMainSvgElement();
    
    this.pathsGroupElement = this.createPathsGroupElement();
    
    // start viewbox
    this.centerViewboxOnImage();

    // create the image borders
    this.svgElement.appendChild(this.createImageBorders());
   
    // create the image crosshairs
    this.svgCrosshairs = this.createImageCrosshairs();
    this.svgElement.appendChild(this.pathsGroupElement);
    this.svgElement.appendChild(this.svgCrosshairs);
   
    this.rootElement.querySelector('.svg-canvas').appendChild(this.svgElement);
    
    this.addEventListeners();
    
    this.app.$stores.drawing.actions.draw('M 0 0');
  },
  methods: {
      // create a copy of a touch object
      copyTouch: function({ identifier, pageX, pageY }) {
          return { identifier, pageX, pageY };
      },
      // find the index of a touch object from an array of touches by unique identifier
      ongoingTouchIndexById: function(ongoingTouch, touches) {
      for (let touchIndex = 0; touchIndex < touches.length; touchIndex++) {
        let id = touches[touchIndex].identifier;

        if (id == ongoingTouch.identifier) {
          return touchIndex;
        }
      }
      return -1;    // not found
    },
    // callback called for the event touchstart
    svgTouchStart: function(event) {
        event.preventDefault();
        const touches = event.changedTouches;
        this.prevTouch = this.copyTouch(touches[0]);
    },
    // callback called for the event touchmove
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
    // callback called for the event touchend
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
    // callback called for the event touchcancel
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
    // zooms in the canvas (increase image size)
    zoomIn: function(event) {
        this.zoom *= this.ZOOM_FACTOR;
        this.svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width * this.zoom} ${this.viewport.height * this.zoom}`);
    },
    // zooms out the canvas (decrease image size)
    zoomOut: function(event) {
        // if(this.zoom >= 2) return;
        this.zoom /= this.ZOOM_FACTOR;
        this.svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width * this.zoom} ${this.viewport.height * this.zoom}`);
    },
    // update the svg viewbox to center on the image
    centerViewboxOnImage: function() {
         // Calculate the viewport based on the image size
        this.viewport.x = - this.BORDER_WIDTH - this.INITIAL_VIEW_MARGIN / 2;
        this.viewport.y = - this.BORDER_WIDTH;
        this.viewport.width = this.size.width + 2 * this.BORDER_WIDTH + this.INITIAL_VIEW_MARGIN;
        this.viewport.height = this.size.height + 2 * this.BORDER_WIDTH;
        
        this.svgElement.setAttributeNS(null, 'viewBox', `${this.viewport.x} ${this.viewport.y} ${this.viewport.width} ${this.viewport.height}`);
    },
    // create the main svg element. It pccupies the full screen;
    createMainSvgElement: function() {
        // create the main svg element
        const svgElement = document.createElementNS(this.XMLNS, 'svg');
        svgElement.setAttributeNS(null, 'width', window.innerWidth);
        svgElement.setAttributeNS(null, 'height', window.innerHeight); // - 140);
        svgElement.style.backgroundColor = '#dddddd';
        
        return svgElement;
    },
    createPathsGroupElement: function() {
        // create the main svg element
        const pathsGroupElement = document.createElementNS(this.XMLNS, 'g');
        pathsGroupElement.setAttributeNS(null, 'width', window.innerWidth);
        pathsGroupElement.setAttributeNS(null, 'height', window.innerHeight); // - 140);
        pathsGroupElement.style.backgroundColor = '#dddddd';
        
        return pathsGroupElement;
    },
    // create a path string for the borders of the image limits
    createImageBordersPath: function() {
        return `
            M -${this.BORDER_WIDTH} -${this.BORDER_WIDTH} 
            h ${this.size.width + 2 * this.BORDER_WIDTH} 
            v ${this.size.height + 2 * this.BORDER_WIDTH} 
            h -${this.size.width + 2 * this.BORDER_WIDTH} 
            Z`;
    },
    // create an g elemebt with paths defining the image limits (width, height)
    createImageBorders: function() {
        const g = document.createElementNS(this.XMLNS, 'g');
        const imageBorders = this.createImageBordersPath();
        const path = document.createElementNS(this.XMLNS, 'path');
        path.setAttributeNS(null, 'stroke', '#000000');
        path.setAttributeNS(null, 'stroke-width', this.BORDER_WIDTH);
        path.setAttributeNS(null, 'stroke-dasharray', '5,5');
        path.setAttributeNS(null, 'd', imageBorders);
        path.setAttributeNS(null, 'opacity', 1.0);
        path.setAttributeNS(null, 'fill', '#ffffff');
        
        this.svgBorders = path;
        g.appendChild(path);
        
        return g;
    },
    // create element to show the current path position
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
    // add all event listeners
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
        
        // store mutations watchers
        this.app.$pubSub.subscribe('store.drawing.addStep', (function() {
          const steps = this.app.$stores.drawing.getters.steps;
          const lastStep = steps[steps.length - 1];
          this.paths.push(lastStep);
          const newPath = this.createNewPath(lastStep);
          this.pathsGroupElement.appendChild(newPath);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.updateStep', (function() {
          const steps = this.app.$stores.drawing.getters.steps;
          const lastStep = steps[steps.length - 1];
          this.paths.push(steps[lastStep]);
          this.updatePath(lastStep);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.setCrosshairs', (function() {
            const crosshairsPosition = this.app.$stores.drawing.getters.crosshairs;
            this.svgCrosshairs.setAttributeNS(null, 'transform', `translate(${crosshairsPosition.x} ${crosshairsPosition.y})`);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.updateCrosshairs', (function() {
            const crosshairsPosition = this.app.$stores.drawing.getters.crosshairs;
            this.svgCrosshairs.setAttributeNS(null, 'transform', `translate(${crosshairsPosition.x} ${crosshairsPosition.y})`);
        }).bind(this));
        
        this.app.$pubSub.subscribe('store.drawing.setCanvasSize', (function() {
            const canvas = this.app.$stores.drawing.getters.canvas;
            this.size.width = canvas.width;
            this.size.height = canvas.height;
            
            // update the current borders
            this.updateImageBorders();
            
            // update the viewbox
           this.centerViewboxOnImage();
        }).bind(this));
        console.log('Done!');
    },
    // add a new path element to the svg
    createNewPath: function(step) {
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
    // update the last created path
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
    // update the image borders (after resize)
    updateImageBorders: function() {
        const borders = this.createImageBordersPath();
        this.svgBorders.setAttributeNS(null, 'd', borders);
   }
  },
};