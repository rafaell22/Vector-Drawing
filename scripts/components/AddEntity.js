import colors from '../theme/theme.js';

export default {
    template: `
        <div class="add-entity">
            <input 
                type="button" 
                class="action-button" 
                value="+"
             >
             <input
                 type="button"
                 class="sub-action-button top"
                 value="Sh"
             >
             <input
                 type="button"
                 class="sub-action-button top-left"
                 value="L"
             >
             <input
                 type="button"
                 class="sub-action-button left"
                 value="T"
             >
         </div>
    `,
    styles: `
        .add-entity .hidden {
            display: none;
        }
        
        .add-entity input {
            border-radius: 50%;
            user-select: none;
            z-index: 1000;
            position: absolute;
            background-color: ${colors.PRIMARY} !important;
            border-top-color: ${colors.PRIMARY_HIGHLIGHT};
            border-left-color: ${colors.PRIMARY_HIGHLIGHT};
            border-right-color: ${colors.PRIMARY_SHADOW};
            border-bottom-color: ${colors.PRIMARY_SHADOW};
            color: #ffffff;
         }
        
        .add-entity .action-button {
             width: 56px;
             height: 56px;
             right: 40px;
             bottom: 40px;
             font-size: 24px;
         }
         
         .add-entity .sub-action-button {
             width: 48px;
             height: 48px;
             font-size: 20px;
         }
         
         .add-entity .sub-action-button.top {
             right: 44px;
             bottom: 120px;
         }
         
         .add-entity .sub-action-button.top-left {
             right: 110px;
             bottom: 105px;
         }
         
          .add-entity .sub-action-button.left {
             right: 120px;
             bottom: 44px;
         }
    `,
    data: {},
    methods: {},
    mounted: function() {}
};