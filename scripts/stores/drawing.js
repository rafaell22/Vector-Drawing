import Step from '../classes/Step.js';
import validate from 'https://cdn.jsdelivr.net/gh/rafaell22/type-validation@0.2.3/validation.js';
// import validate from 'http://localhost:8080/validation.js';

const COMMANDS = {
  MOVE: new RegExp('^m$', 'i'),
  FILL: new RegExp('^FILL$', 'i'),
  STROKE: new RegExp('^STROKE$', 'i'),
  HORIZONTAL_LINE: new RegExp('^h$', 'i'),
  VERTICAL_LINE: new RegExp('^v$', 'i'),
  LINE: new RegExp('^l$', 'i'),
  CUBIC_BEZIER_CURVE: new RegExp('^c$', 'i'),
  SMOOTH_CUBIC_BEZIER_CURVE: new RegExp('^s$', 'i'),
  QUADRATIC_BEZIER_CURVE: new RegExp('^q$', 'i'),
  SMOOTH_QUADRATIC_BEZIER_CURVE: new RegExp('^t$', 'i'),
  ELLIPTICAL_ARC_CURVE: new RegExp('^a$', 'i'),
  RESIZE_CANVAS: new RegExp('^resize-canvas$', 'i'),
  CLEAR_CANVAS: new RegExp('^clear-canvas$', 'i'),
}

export default {
    state: {
      steps: [],
      crosshairs: {
          x: 0,
          y: 0,
      },
      canvas: {
          width: 48, // in px
          height: 48, // in px
      },
    },
    mutations: {
      addStep: function({ state }, path) {
          state.steps.push(new Step(path));
      },
      updateStep: function({ state }, path, pathConfig, index) {
          const currentStep = state.steps[index];
          if (path) {
              currentStep.path += ` ${path}`;
          }
          if (pathConfig) {
              if (pathConfig.stroke) {
                  if (pathConfig.stroke.color) {
                      currentStep.stroke.color = pathConfig.stroke.color;
                  }
                  if (
                    pathConfig.stroke.width ||
                    pathConfig.stroke.width === 0
                  ) {
                      currentStep.stroke.width = pathConfig.stroke.width;
                  }
              }
              if (pathConfig.fill) {
                  if (pathConfig.fill === 'none') {
                      pathConfig.fill = 'none';
                  } else {
                      if (pathConfig.fill.color) {
                          currentStep.fill = {
                              color: pathConfig.fill.color
                          };
                      }
                  }
              }
          }
      },
      updateCrosshairs: function({ state }, { dx, dy }) {
          state.crosshairs.x += dx;
          state.crosshairs.y += dy;
      },
      setCrosshairs: function({ state }, { x, y }) {
          state.crosshairs.x = x;
          state.crosshairs.y = y;
      },
      setCanvasSize: function({ state }, { width, height }) {
          state.canvas.width = width;
          state.canvas.height = height;
      },
      deleteSteps: function({ state }) {
          state.steps = [];
      }
    },
    actions: {
        // load images from local folder
        loadImage: function(src) {
            return new Promise((resolve, reject) => {
                const elImage = document.createElement('IMG');
                elImage.addEventListener('load', function() {
                    resolve(elImage);
                });
                elImage.src = `../../images/${src}.png`;
            });
        },
        // load multiple images from local folders
        loadImages: async function(sources) {
            for(let sourceIndex = (sources.length - 1); sourceIndex > -1; sourceIndex--) {
                this.cache.images[sources[sourceIndex]] = await this.loadImage(sources[sourceIndex]);
            }
        },
        // load json file from local folder
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
        // load multiple json files from local folder
        loadJsons: async function(urls) {
            for(let urlIndex = (urls.length - 1); urlIndex > -1; urlIndex--) {
              this.cache.jsons[urls[urlIndex]] = await this.loadJson(urls[urlIndex]);
            }
        },
      draw: function({ mutations, state }, path) {
        const command = path.split(' ')[0];
        const commandArguments = path.split(' ').slice(1);

        switch (true) {
          case COMMANDS.MOVE.test(command):
              move(path, command, commandArguments, { mutations });
              break;
          case COMMANDS.FILL.test(command):
              fill(commandArguments, { state, mutations });
              break;
          case COMMANDS.STROKE.test(command):
              stroke(commandArguments, { state, mutations });
              break;
          case COMMANDS.HORIZONTAL_LINE.test(command):
              horizontalLine(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.VERTICAL_LINE.test(command):
              verticalLine(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.LINE.test(command):
              line(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.CUBIC_BEZIER_CURVE.test(command):
              cubicBezierCurve(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.SMOOTH_CUBIC_BEZIER_CURVE.test(command):
              smoothCubicBezierCurve(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.QUADRATIC_BEZIER_CURVE.test(command):
              quadraticBezierCurve(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.SMOOTH_QUADRATIC_BEZIER_CURVE.test(command):
              smoothQuadraticBezierCurve(path, command, commandArguments, { state, mutations });
              break;
          case COMMANDS.ELLIPTICAL_ARC_CURVE.test(command):
              ellipticalArcCurve(path, command, commandArguments, { state, mutations })
              break;
          case COMMANDS.RESIZE_CANVAS.test(command):
              resizeCanvas(path, command, commandArguments, { state, mutations })
              break;
          case COMMANDS.CLEAR_CANVAS.test(command): 
              clearCanvas({ state, mutations });
              break;
          default:
              console.log('Default');
              return;
        }
      }
    },
    getters: {
      steps: function() {
        return this.state.steps;
      },
      crosshairs: function() {
        return this.state.crosshairs;
      },
      canvas: function() {
        return this.state.canvas;
      },
    },
};

function move(path, command, commandArguments, { mutations }) {
    if (commandArguments.length !== 2) {
      if (commandArguments.length < 2) {
        throw new Error('Missing arguments for command "Move"');
      } else {
        throw new Error('Too many arguments for command "Move"');
      }
      return;
    }

    const move = {
      x: null,
      y: null
    }
    try {
      move.x = parseFloat(commandArguments[0]);
      move.y = parseFloat(commandArguments[1]);
      
      validate(move.x).number();
      validate(move.y).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Move". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.addStep(path);
    
    switch (command) {
      case 'M':
        mutations.setCrosshairs({ x: move.x, y: move.y });
        break;
      case 'm':
        mutations.updateCrosshairs({ dx: move.x, dy: move.y });
        break;
      default:
    }
}

function fill(commandArguments, { state, mutations }) {
    if (commandArguments.length !== 1) {
      return;
    }

    if (commandArguments[0] === 'none') {
      mutations.updateStep(null, {
          fill: 'none'
        }, (state.steps.length - 1));
    } else {
        mutations.updateStep(null, {
          fill: {
            color: commandArguments[0]
          }
        }, (state.steps.length - 1));
    }
}

function stroke(commandArguments, { state, mutations }) {
    if (commandArguments.length !== 2) {
      return;
    }

    mutations.updateStep(null, {
      stroke: {
        color: commandArguments[0],
        width: parseFloat(commandArguments[1])
      }
    }, (state.steps.length - 1));
}

function horizontalLine(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 1) {
        if (commandArguments.length < 1) {
            throw new Error('Missing arguments for command "Horizontal Line"');
            return;
        } else {
            throw new Error('Too many arguments for command "Horizontal Line"');
            return;
        }
        return;
    }
    
    const horizontal = {
      x: null
    };
    try {
      horizontal.x = parseFloat(commandArguments[0]);
      
      validate(horizontal.x).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Horizontal Line". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'H':
        mutations.setCrosshairs({ x: horizontal.x, y: 0 });
        break;
      case 'h':
        mutations.updateCrosshairs({ dx: horizontal.x, dy: 0 });
        break;
      default:
    }
}

function verticalLine(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 1) {
        if (commandArguments.length < 1) {
            throw new Error('Missing arguments for command "Vertical Line"');
            return;
        } else {
            throw new Error('Too many arguments for command "Vertical Line"');
            return;
        }
        return;
    }
    
    const vertical = {
      y: null
    };
    try {
      vertical.y = parseFloat(commandArguments[0]);
      
      validate(vertical.y).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Vertical Line". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'V':
        mutations.setCrosshairs({ x: 0, y: vertical.y });
        break;
      case 'v':
        mutations.updateCrosshairs({ dx: 0, dy: vertical.y });
        break;
      default:
    }
}

function line(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 2) {
      if (commandArguments.length < 2) {
        throw new Error('Missing arguments for command "Line"');
        return;
      } else {
        throw new Error('Too many arguments for command "Line"');
        return;
      }
      return;
    }

    const line = {
      x: null,
      y: null
    };
    try {
      line.x = parseFloat(commandArguments[0]);
      line.y = parseFloat(commandArguments[1]);
      
      validate(line.x).number();
      validate(line.y).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Line". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'L':
        mutations.setCrosshairs({ x: line.x, y: line.y });
        break;
      case 'l':
        mutations.updateCrosshairs({ dx: line.x, dy: line.y });
        break;
      default:
    }
}

function cubicBezierCurve(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 6) {
      if (commandArguments.length < 6) {
        throw new Error('Missing arguments for command "Cubic Bezier Curve"');
        return;
      } else {
        throw new Error('Too many arguments for command "Cubic Bezier Curve"');
        return;
      }
      return;
    }

    const cubic = {
      // x position of the end of the curve
      x: null,
      // y position of the end of the curve
      y: null,
      // x position of the control point of the starting point
      x1: null,
      // y position of the control point of the starting point
      y1: null,
      // x position of the control point of the ending point
      x2: null,
      // y position of the control point of the ending point
      y2: null,
    };
    
    try {
      cubic.x = parseFloat(commandArguments[4]);
      cubic.y = parseFloat(commandArguments[5]);
      cubic.x1 = parseFloat(commandArguments[0]);
      cubic.y1 = parseFloat(commandArguments[1]);
      cubic.x2 = parseFloat(commandArguments[2]);
      cubic.y2 = parseFloat(commandArguments[3]);
      
      validate(cubic.x).number();
      validate(cubic.y).number();
      validate(cubic.x1).number();
      validate(cubic.y1).number();
      validate(cubic.x2).number();
      validate(cubic.y2).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Cubic Bezier Curve". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'C':
        mutations.setCrosshairs({ x: cubic.x, y: cubic.y });
        break;
      case 'c':
        mutations.updateCrosshairs({ dx: cubic.x, dy: cubic.y });
        break;
      default:
    }
}

function smoothCubicBezierCurve(path, command, commandArguments, { state, mutations }) {
  if (commandArguments.length !== 4) {
    if (commandArguments.length < 4) {
      throw new Error('Missing arguments for command "Smooth Cubic Bezier Curve"');
      return;
    } else {
      throw new Error('Too many arguments for command "Smooth Cubic Bezier Curve"');
      return;
    }
    return;
  }

  const smoothCubic = {
    // x position of the end of the curve
    x: null,
    // y position of the end of the curve
    y: null,
    // x position of the control point of the ending point
    x1: null,
    // y position of the control point of the ending point
    y1: null,
  }
  
  try {
    smoothCubic.x = parseFloat(commandArguments[2]);
    smoothCubic.y = parseFloat(commandArguments[3]);
    smoothCubic.x1 = parseFloat(commandArguments[0]);
    smoothCubic.y1 = parseFloat(commandArguments[1]);
    
    validate(smoothCubic.x).number();
    validate(smoothCubic.y).number();
    validate(smoothCubic.x1).number();
    validate(smoothCubic.y1).number();
  } catch (errorParsingArguments) {
    throw new Error('Error running "Smooth Cubic Bezier Curve". Some of the arguments are not "Numbers"');
    return;
  }

  mutations.updateStep(path, null, (state.steps.length - 1));
  switch (command) {
    case 'S':
      mutations.setCrosshairs({ x: smoothCubic.x, y: smoothCubic.y });
      break;
    case 's':
      mutations.updateCrosshairs({ dx: smoothCubic.x, dy: smoothCubic.y });
      break;
    default:
  }
}

function quadraticBezierCurve(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 4) {
      if (commandArguments.length < 4) {
        throw new Error('Missing arguments for command "Quadratic Bezier Curve"');
        return;
      } else {
        throw new Error('Too many arguments for command "Quadratic Bezier Curve"');
        return;
      }
      return;
    }

    const quadratic = {
      // x position of the end of the curve
      x: null,
      // y position of the end of the curve
      y: null,
      // x position of the control point of the starting point
      x1: null,
      // y position of the control point of the starting point
      y1: null,
    };
    
    try {
      quadratic.x = parseFloat(commandArguments[2]);
      quadratic.y = parseFloat(commandArguments[3]);
      quadratic.x1 = parseFloat(commandArguments[0]);
      quadratic.y1 = parseFloat(commandArguments[1]);
      
      validate(quadratic.x).number();
      validate(quadratic.y).number();
      validate(quadratic.x1).number();
      validate(quadratic.y1).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Quadratic Bezier Curve". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'Q':
        mutations.setCrosshairs({ x: quadratic.x, y: quadratic.y });
        break;
      case 'q':
        mutations.updateCrosshairs({ dx: quadratic.x, dy: quadratic.y });
        break;
      default:
    }
}

function smoothQuadraticBezierCurve(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 2) {
      if (commandArguments.length < 2) {
        throw new Error('Missing arguments for command "Smooth Quadratic Bezier Curve"');
        return;
      } else {
        throw new Error('Too many arguments for command "Smooth Quadratic Bezier Curve"');
        return;
      }
      return;
    }

    const smoothQuadratic = {
      // x position of the end of the curve
      x: null,
      // y position of the end of the curve
      y: null,
    }
    
    try {
      smoothQuadratic.x = parseFloat(commandArguments[0]);
      smoothQuadratic.y = parseFloat(commandArguments[1]);
      
      validate(smoothQuadratic.x).number();
      validate(smoothQuadratic.y).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Smooth Quadratic Bezier Curve". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'T':
        mutations.setCrosshairs({ x: smoothQuadratic.x, y: smoothQuadratic.y });
        break;
      case 't':
        mutations.updateCrosshairs({ dx: smoothQuadratic.x, dy: smoothQuadratic.y });
        break;
      default:
    }
}

function ellipticalArcCurve(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 7) {
      if (commandArguments.length < 7) {
        throw new Error('Missing arguments for command "Elliptical Arc Curve"');
        return;
      } else {
        throw new Error('Too many arguments for command "Elliptical Arc Curve"');
        return;
      }
      return;
    }

    const arc = {
      rx: null,
      ry: null,
      angle: null,
      largeArcFlag: null,
      sweepFlag: null,
      x: null,
      y: null,
    };

    try {
      arc.rx = parseFloat(commandArguments[0]);
      arc.ry = parseFloat(commandArguments[1]);
      arc.angle = parseFloat(commandArguments[2]);
      arc.largeArcFlag = parseFloat(commandArguments[3]);
      arc.sweepFlag = parseFloat(commandArguments[4]);
      arc.x = parseFloat(commandArguments[5]);
      arc.y = parseFloat(commandArguments[6]);
      
      validate(arc.rx).number();
      validate(arc.ry).number();
      validate(arc.angle).number();
      validate(arc.largeArcFlag).number().values(0, 1);
      validate(arc.sweepFlag).number().values(0, 1);
      validate(arc.x).number();
      validate(arc.y).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Elliptical Arc Curve". Some of the arguments are not "Numbers"');
      return;
    }

    mutations.updateStep(path, null, (state.steps.length - 1));
    switch (command) {
      case 'S':
        mutations.setCrosshairs({ x: arc.x, y: arc.y });
        break;
      case 's':
        mutations.updateCrosshairs({ dx: arc.x, dy: arc.y });
        break;
      default:
    }
}

function resizeCanvas(path, command, commandArguments, { state, mutations }) {
    if (commandArguments.length !== 2) {
      if (commandArguments.length < 2) {
        throw new Error('Missing arguments for command "Resize Canvas"');
        return;
      } else {
        throw new Error('Too many arguments for command "Resize Canvas"');
        return;
      }
      return;
    }
    
    const canvas = {
      width: null,
      height: null,
    };

    try {
      canvas.width = parseFloat(commandArguments[0]);
      canvas.height = parseFloat(commandArguments[1]);
      
      validate(canvas.width).number();
      validate(canvas.height).number();
    } catch (errorParsingArguments) {
      throw new Error('Error running "Resize Canvas". Some of the arguments are not "Numbers"');
      return;
    }

    console.log('drawing/resizeCanvas/canvas: ', canvas);
    mutations.setCanvasSize(canvas);
}

function clearCanvas({ state, mutations }) {
    mutations.deleteSteps();
}