
CanvasRenderingContext2D.prototype.clear = function(fillStyle) {
 this.save();
 let x = 0, y = 0;
 this.setTransform(1, 0, 0, 1, 0, 0);
 if (fillStyle) {
   this.fillStyle = fillStyle;
   this.fillRect(x, y, this.canvas.width, this.canvas.height);
 } else {
   this.clearRect(x, y, this.canvas.width, this.canvas.height);
 }
 this.restore();
};


// Store the original drawImage function so we can actually use it.
CanvasRenderingContext2D.prototype.__drawImage = CanvasRenderingContext2D.prototype.drawImage;

/**
 * Draw an image onto the canvas.
 *
 * This method is better than the original `drawImage()` for several reasons:
 *
 * - It uses a cache to allow images to be drawn immediately if they were
 *   pre-loaded and to store images that were not pre-loaded so that they can
 *   be drawn immediately later.
 * - It can draw {@link Sprite}, {@link SpriteMap}, and {@link Layer} objects
 *   as well as the usual images, videos, and canvases. (Note that when Layers
 *   are drawn using this method, their "relative" property IS taken into
 *   account.)
 * - It allows drawing an image by passing in the file path instead of an
 *   Image object.
 *
 * Additionally, this method has an optional `finished` parameter which is a
 * callback that runs when the image passed in the `src` parameter is finished
 * loading (or immediately if the image is already loaded or is a video). The
 * callback's context (its `this` object) is the canvas graphics object. Having
 * this callback is useful because if you do not pre-load images, the image
 * will not be loaded (and therefore will not be drawn) for at least the first
 * time that drawing it is attempted. You can use the `finished` callback to
 * draw the image after it has been loaded if you want.
 *
 * Apart from the additions above, this method works the same way as the
 * [original in the spec](http://www.w3.org/TR/2dcontext/#drawing-images-to-the-canvas).
 *
 * As a summary, this method can be invoked three ways:
 *
 * - `drawImage(src, x, y[, finished])`
 * - `drawImage(src, x, y, w, h[, finished])`
 * - `drawImage(src, sx, sy, sw, sh, x, y, w, h[, finished])`
 *
 * In each case, the `src` parameter accepts one of the following:
 *
 *   - The file path of an image to draw
 *   - A {@link Sprite} or {@link SpriteMap} object
 *   - A {@link Layer} object
 *   - An HTMLCanvasElement
 *   - An HTMLImageElement (same thing as an Image)
 *   - An HTMLVideoElement
 *
 * The `x` and `y` parameters indicate the coordinates of the canvas graphics
 * context at which to draw the top-left corner of the image. (Often this is
 * the number of pixels from the top-left corner of the canvas, though the
 * context can be larger than the canvas if the viewport has scrolled, e.g.
 * with context.translate().)
 *
 * The `w` and `h` parameters indicate the width and height of the image,
 * respectively. Defaults to the image width and height, respectively (or, for
 * a Sprite or SpriteMap, defaults to the projectedW and projectedH,
 * respectively).
 *
 * The `sx`, `sy`, `sw`, and `sh` parameters define a rectangle within the
 * image that will be drawn onto the canvas. `sx` and `sy` are the x- and y-
 * coordinates (within the image) of the upper-left corner of the source
 * rectangle, respectively, and `sw` and `sh` are the width and height of the
 * source rectangle, respectively. These parameters are ignored when drawing a
 * Sprite or SpriteMap. The W3C provides a helpful image to understand these
 * parameters:
 *
 * <img src="http://www.w3.org/TR/2dcontext/images/drawImage.png" alt="drawImage" />
 *
 * See also {@link CanvasRenderingContext2D#drawPattern}() and
 * Caches.preloadImages().
 *
 * @param {Mixed} src
 * @param {Number} [sx]
 * @param {Number} [sy]
 * @param {Number} [sw]
 * @param {Number} [sh]
 * @param {Number} x
 * @param {Number} y
 * @param {Number} [w]
 * @param {Number} [h]
 * @param {Function} [finished]
 * @param {Array} [finished.args]
 *   An array containing the arguments passed to the drawImage() invocation.
 * @param {Boolean} [finished.drawn]
 *   Whether the image was actually drawn (it will not be drawn if the image
 *   wasn't loaded before drawImage() attempted to draw it).
 *
 * @member CanvasRenderingContext2D
 */
CanvasRenderingContext2D.prototype.drawImage = function(src, sx, sy, sw, sh, x, y, w, h, finished) {
  // Allow the finished parameter to come last,
  // regardless of how many parameters there are.
  if (arguments.length % 2 === 0) {
    finished = Array.prototype.pop.call(arguments);
    // Don't let finished interfere with other arguments.
    if (sw instanceof Function) sw = undefined;
    else if (x instanceof Function) x = undefined;
    else if (w instanceof Function) w = undefined;
    if (typeof finished != 'function') {
      finished = undefined;
    }
  }
  const t = this, a = arguments;
  // Keep the stupid order of parameters specified by the W3C.
  // It doesn't matter that we're not providing the correct default values;
  // those will be implemented by the original __drawImage() later.
  if (typeof x != 'number' && typeof y === 'undefined' &&
      typeof w != 'number' && typeof h === 'undefined') {
    x = sx;
    y = sy;
    if (typeof sw == 'number' && typeof sh !== 'undefined') {
      w = sw;
      h = sh;
    }
    sx = undefined;
    sy = undefined;
    sw = undefined;
    sh = undefined;
  }
  // Wrapper function for doing the actual drawing
  const _drawImage = function(image, x, y, w, h, sx, sy, sw, sh) {
    if (w && h) {
      if (sw && sh) {
        t.__drawImage(image, sx, sy, sw, sh, x, y, w, h);
      }
      else {
        t.__drawImage(image, x, y, w, h);
      }
    }
    else {
      t.__drawImage(image, x, y);
    }
    if (finished instanceof Function) {
      finished.call(t, a, true);
    }
  };
  let image;
  if ((typeof Sprite !== 'undefined' && src instanceof Sprite) ||
      (typeof SpriteMap !== 'undefined' && src instanceof SpriteMap)) { // draw a sprite
    src.draw(this, x, y, w, h);
    if (finished instanceof Function) {
      finished.call(t, a, true); // Sprite images are loaded on instantiation
    }
  }
  else if (typeof Layer !== 'undefined' && src instanceof Layer) { // Draw the Layer's canvas
    t.save();
    t.globalAlpha = src.opacity;
    if (src.relative === 'canvas') {
      t.translate(world.xOffset, world.yOffset);
    }
    const f = finished;
    finished = undefined; // Don't call finished() until after translating back
    _drawImage(src.canvas, x, y, w, h, sx, sy, sw, sh);
    t.restore();
    finished = f;
    if (finished instanceof Function) {
      finished.call(t, a, true);
    }
  }
  else if (src instanceof HTMLCanvasElement || // draw a canvas
      src instanceof HTMLVideoElement) { // draw a video
    _drawImage(src, x, y, w, h, sx, sy, sw, sh);
  }
  else if (src instanceof HTMLImageElement || // draw an image directly
      src instanceof Image) { // same thing
    image = src;
    src = image._src || image.src; // check for preloaded src
    if (!src) { // can't draw an empty image
      if (finished instanceof Function) {
        finished.call(t, a, false);
      }
      return;
    }
    if (image.complete || (image.width && image.height)) { // draw loaded images
      _drawImage(image, x, y, w, h, sx, sy, sw, sh);
    }
    else { // if the image is not loaded, don't draw it
      if (image._src) { // We've already tried to draw this one
        // The finished callback will run from the first time it was attempted to be drawn
        return;
      }
      const o = image.onload;
      image.onload = function() {
        if (typeof o === 'function') { // don't overwrite any existing handler
          o();
        }
        if (finished instanceof Function) {
          finished.call(t, a, false);
        }
      };
    }
  }
  else {
    throw new TypeMismatchError('Image type not recognized.');
  }
};