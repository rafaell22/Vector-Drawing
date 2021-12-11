export default {
    state: {
      steps: [],
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
    },
    actions: {
      draw: function({ mutations, state }, path) {
        const command = path.split(' ')[0];
        const commandArguments = path.split(' ').slice(1);

        switch (command) {
          case 'M':
          case 'm':
              if (commandArguments.length !== 2) {
                return;
              }

              mutations.addStep(path);
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
          case 'h':
              if (commandArguments.length !== 1) {
                return;
              }
          
              mutations.updateStep(path, null, (state.steps.length - 1));
              break;
          case 'V':
          case 'v':
              if (commandArguments.length !== 1) {
                return;
              }
          
              mutations.updateStep(path, null, (state.steps.length - 1));
              break;
          case 'L':
          case 'l':
              if (commandArguments.length !== 2) {
                return;
              }
              
              mutations.updateStep(path, null, (state.steps.length - 1));
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
    },
  };