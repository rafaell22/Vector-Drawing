export default {
    template: `
        <div class="draw-step-input">
            <input type="text" class="draw-step" 
                data-bind="{
                    'value':'step',
                    '@input':'updateStep'
                }"
            >
            <input type="button" class="action-button"
                data-bind="{ 
                  'value':'actionDescription',
                  '@touchstart':'eventTouchStart',
                  '@touchend':'eventTouchEnd'
                }"
            >
            <input type="button" class="sub-action-button hidden"
                data-bind="{ 
                  'value':'changeBackgroundDescription',
                  'class.hidden':'isSubmenuNotShowing'
                }"
            >
            <div class="sub-menu-overlay"
                data-bind="{ 
                  'class.hidden':'isSubmenuNotShowing'
                }"
            >
        </div>
    `,
    styles: `
        .draw-step-input {
            width: 100%;
            padding: 10px;
        }
        
        .draw-step-input .hidden {
          display: none;
        }
        
        .draw-step-input .draw-step {
            width: 330px;
            height: 56px;
            border-radius: 5px;
            font-size: 20;
            padding: 10px;
        }
        
        .draw-step-input .action-button {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            margin-left: 15px;
            user-select: none;
            z-index: 10;
            position: relative;
        }
        
        .draw-step-input .sub-action-button {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            margin-left: 15px;
            position: absolute;
            right: 15px;
            bottom: 90px;
            z-index: 10;
            position: relative;
        }
        
        .draw-step-input .sub-menu-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #000000;
            opacity: 50%;
        }
    `,
    data: {
      actionDescription: 'DRAW',
      changeBackgroundDescription: 'BG',
      elInput: null,
      elButton: null,
      step: '',
      buttonTouchStart: null,
      buttonHoldThreshhold: 1000, // in miliseconds
      // This variable naming is a bit confusing, but that is a limitation of the framework for now
      //   if true > submenu is NOT shwoing
      //   if false > submenut is showing
      isSubmenuNotShowing: true,
    },
    methods: {
      addDrawStep: function() {
          this.app.$stores.drawing.actions.draw(this.step);
          this.step = '';
      },
      updateStep: function() {
          this.step = this.elInput.value;
      },
      openSubMenu: function() {
        this.buttonTouchStart = null;
        this.isSubmenuNotShowing = false;
        // const subMenuButtons = this.rootElement.querySelectorAll('.sub-action-button');
        // for(let buttonIndex = (subMenuButtons.length - 1); buttonIndex > -1; buttonIndex--) {
        //   subMenuButtons[buttonIndex].classList.remove('hidden');
        // }
        this.actionDescription = 'X';
        console.log('Open menu!');
      },
      closeSubmenu: function() {
        this.buttonTouchStart = null;
        this.isSubmenuNotShowing = true;
        // const subMenuButtons = this.rootElement.querySelectorAll('.sub-action-button');
        // for(let buttonIndex = (subMenuButtons.length - 1); buttonIndex > -1; buttonIndex--) {
        //   subMenuButtons[buttonIndex].classList.add('hidden');
        // }
        this.actionDescription = 'DRAW';
        console.log('Close menu!');
      },
      eventTouchStart: function(touchEvent) {
          if (this.actionDescription === 'X') {
            this.closeSubmenu();
            return;
          }
        
          this.buttonTouchStart = new Date().getTime();
          setTimeout((function() {
            if (
              this.buttonTouchStart !== null &&
              (new Date()).getTime() - this.buttonTouchStart >= this.buttonHoldThreshhold
            ) {
              this.openSubMenu();
            }
          }).bind(this), this.buttonHoldThreshhold);
      },
      eventTouchEnd: function(touchEvent) {
          if (
            this.buttonTouchStart !== null &&
            (new Date()).getTime() - this.buttonTouchStart >= this.buttonHoldThreshhold
          ) {
            return;
          }

          this.addDrawStep();
      }
    },
    mounted: function() {
      // Create a reference to the input element
      this.elInput = this.rootElement.querySelector('.draw-step');
      
      // Create a reference to the button element
      this.elButton = this.rootElement.querySelector('.action-button');
      
      // Set input width dinamically
      const buttonWidth = this.elButton.offsetWidth;
      const buttonComputedStyle = window.getComputedStyle(this.elButton)
      const buttonLeftMargin = parseInt(buttonComputedStyle.marginLeft.replace('px', ''));
      const windowWidth = window.innerWidth;
      const containerLeftPadding = parseInt(window.getComputedStyle(this.rootElement.querySelector('.draw-step-input')).paddingLeft.replace('px', ''));
      this.elInput.style.width = windowWidth - (2 * containerLeftPadding + buttonLeftMargin + buttonWidth + 4);
    }
};