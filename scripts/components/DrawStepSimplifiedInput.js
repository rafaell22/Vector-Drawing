import colors from '../theme/theme.js';

export default {
    template: `
        <div class="draw-step-simplified-input">
            <div class="draw-step">
                <div class="command"></div>
                <div class="x"></div>
                <div class="y"></div>
                <input type="button" value="DRAW">
            </div>
            <div class="keyboard-command">
                <input type="button" value="^"
                    data-bind="{
                        '@click': 'toUpper'
                    }"
                >
                <input type="button" value="m">
                <input type="button" value="l">
                <input type="button" value="h">
                <input type="button" value="v">
            </div>
            <div class="keyboard-command-upper hidden">
                <input type="button" value="^"
                  data-bind="{
                      '@click': 'toLower'
                  }"
                >
                <input type="button" value="M">
                <input type="button" value="L">
                <input type="button" value="H">
                <input type="button" value="V">
            </div>
            <div class="keyboard-values-numbers"></div>
            <div class="keyboard-values-hex"></div>
        </div>
    `,
    styles: `
        .draw-step-simplified-input {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            padding: 10px;
        }
        
        .draw-step-simplified-input .hidden {
            display: none !important;
        }
        
        .draw-step-simplified-input .draw-step {
            width: 100%;
            font-size: 20;
            padding: 4px;
        }
        
        .draw-step-simplified-input .draw-step div {
            width: 80px;
            height: 32px;
            border: 1px solid black;
            border-radius: 5px;
            background-color: ${colors.LIGHT_GRAY};
            float: left;
            margin: 0 5px;
        }
        
        .draw-step-simplified-input .draw-step input {
            float: right;
        }
        
        .draw-step-simplified-input .keyboard-command,  .draw-step-simplified-input .keyboard-command-upper {
            width: 100%;
            display: flex;
            padding: 4px;
        }
        
         .draw-step-simplified-input input {
             height: 32px;
             font-size: 24px;
             font-weight: bold;
             flex: 1;
             margin: 0 5px;
            background-color: ${colors.PRIMARY};
            color: #ffffff;
            border-radius: 5px;
        }
    `,
    data: {
      elInput: null,
      elButton: null,
      step: '',
    },
    methods: {
      addDrawStep: function() {
          this.app.$stores.drawing.actions.draw(this.step);
          this.step = '';
      },
      updateStep: function() {
          this.step = this.elInput.value;
      },
      toUpper: function() {
          this.rootElement.querySelector('.keyboard-command').classList.add('hidden');
          this.rootElement.querySelector('.keyboard-command-upper').classList.remove('hidden');
      },
      toLower: function() {
          this.rootElement.querySelector('.keyboard-command').classList.remove('hidden');
          this.rootElement.querySelector('.keyboard-command-upper').classList.add('hidden');
      }
    },
    mounted: function() {}
};