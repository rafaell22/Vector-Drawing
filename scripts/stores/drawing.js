import Step from '../classes/Step.js';

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
          console.log('Update: ', state.crosshairs);
      },
      setCrosshairs: function({ state }, { x, y }) {
          state.crosshairs.x = x;
          state.crosshairs.y = y;
          console.log('Set: ', state.crosshairs);
      },
    },
    actions: {
      draw: function({ mutations, state }, path) {
        const command = path.split(' ')[0];
        const commandArguments = path.split(' ').slice(1);

        switch (command) {
          case 'M':
              if (commandArguments.length !== 2) {
                return;
              }

              mutations.addStep(path);
              mutations.setCrosshairs({ x: parseFloat(commandArguments[0]), y: parseFloat(commandArguments[1]) });
              break;
          case 'm':
              if (commandArguments.length !== 2) {
                return;
              }

              mutations.addStep(path);
              mutations.updateCrosshairs({ dx: parseFloat(commandArguments[0]), dy: parseFloat(commandArguments[1]) });
              break;
          case 'FILL':
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
          case 'STROKE':
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
          case 'H':
              if (commandArguments.length !== 1) {
                return;
              }

              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.setCrosshairs({ x: parseFloat(commandArguments[0]), y: 0 });
              break;
          case 'h':
              if (commandArguments.length !== 1) {
                return;
              }
          
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.updateCrosshairs({ dx: parseFloat(commandArguments[0]), dy: 0 });
              break;
          case 'V':
              if (commandArguments.length !== 1) {
                return;
              }

              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.setCrosshairs({ x: 0, y: parseFloat(commandArguments[0]) });
              break;
          case 'v':
              if (commandArguments.length !== 1) {
                return;
              }
          
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.updateCrosshairs({ dx: 0, dy: parseFloat(commandArguments[0]) });
              break;
          case 'L':
              if (commandArguments.length !== 2) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.setCrosshairs({ x: parseFloat(commandArguments[0]), y: parseFloat(commandArguments[1]) });
              break;
          case 'l':
              if (commandArguments.length !== 2) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.updateCrosshairs({ dx: parseFloat(commandArguments[0]), dy: parseFloat(commandArguments[1]) });
              break;
          case 'C':
              if (commandArguments.length !== 6) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.setCrosshairs({ x: parseFloat(commandArguments[4]), y: parseFloat(commandArguments[5]) });
              break;
          case 'c':
              if (commandArguments.length !== 6) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.updateCrosshairs({ dx: parseFloat(commandArguments[4]), dy: parseFloat(commandArguments[5]) });
              break;
          case 'S':
              if (commandArguments.length !== 4) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.setCrosshairs({ x: parseFloat(commandArguments[2]), y: parseFloat(commandArguments[3]) });
              break;
          case 's':
              if (commandArguments.length !== 4) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
              mutations.updateCrosshairs({ dx: parseFloat(commandArguments[2]), dy: parseFloat(commandArguments[3]) });
              break;
          default:
              if(
                state.steps.length === 0
              ) {
                  mutations.addStep(path);
              } else {
                  mutations.updateStep(path, null, (state.steps.length - 1));
              }
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