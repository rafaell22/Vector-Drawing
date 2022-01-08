import Step from '../classes/Step.js';
import validate from 'https://cdn.jsdelivr.net/gh/rafaell22/type-validation@0.2.3/validation.js';
// import validate from 'http://localhost:8080/validation.js';

export default {
    state: {
      steps: [],
      crosshairs: {
          x: 0,
          y: 0,
      }
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
          
          console.log('currentStep: ', currentStep);
      },
      updateCrosshairs: function({ state }, { dx, dy }) {
          state.crosshairs.x += dx;
          state.crosshairs.y += dy;
      },
      setCrosshairs: function({ state }, { x, y }) {
          state.crosshairs.x = x;
          state.crosshairs.y = y;
      },
    },
    actions: {
      draw: function({ mutations, state }, path) {
        const command = path.split(' ')[0];
        const commandArguments = path.split(' ').slice(1);

        switch (true) {
          case /m/i.test(command):
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
              break;
          case /FILL/i.test(command):
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
              break;
          case /STROKE/i.test(command):
              if (commandArguments.length !== 2) {
                return;
              }
          
              mutations.updateStep(null, {
                stroke: {
                  color: commandArguments[0],
                  width: parseFloat(commandArguments[1])
                }
              }, (state.steps.length - 1));
              break;
          case /h/i.test(command):
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
              break;
          case /v/i.test(command):
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
              break;
          case /l/i.test(command): 
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
              break;
          case /c/i.test(command):
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
              break;
          case /s/i.test(command):
              if (commandArguments.length !== 4) {
                if (commandArguments.length < 4) {
                  throw new Error('Missing arguments for command "Cubic Bezier Curve"');
                  return;
                } else {
                  throw new Error('Too many arguments for command "Cubic Bezier Curve"');
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
                throw new Error('Error running "Cubic Bezier Curve". Some of the arguments are not "Numbers"');
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
              break;
          case /a/i.test(command):
            console.log(1);
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
    
              console.log(2);
              const arc = {
                rx: null,
                ry: null,
                angle: null,
                largeArcFlag: null,
                sweepFlag: null,
                x: null,
                y: null,
              };
              console.log(3);
              try {
                console.log(4);
                arc.rx = parseFloat(commandArguments[0]);
                arc.ry = parseFloat(commandArguments[1]);
                arc.angle = parseFloat(commandArguments[2]);
                arc.largeArcFlag = parseFloat(commandArguments[3]);
                arc.sweepFlag = parseFloat(commandArguments[4]);
                arc.x = parseFloat(commandArguments[5]);
                arc.y = parseFloat(commandArguments[6]);
                
                console.log(5);
                validate(arc.rx).number();
                validate(arc.ry).number();
                validate(arc.angle).number();
                validate(arc.largeArcFlag).number().values(0, 1);
                validate(arc.sweepFlag).number().values(0, 1);
                validate(arc.x).number();
                validate(arc.y).number();
                console.log(6);
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
              break;
          default:
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
    },
  };