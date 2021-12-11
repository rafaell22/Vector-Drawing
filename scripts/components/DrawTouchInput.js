export default {
    template: `
        <div class="draw-touch-input">
            <input type="button" class="action-button"
                data-bind="{ 
                    'value':'actionDescription',
                    'style.top':'centerX',
                    'style.left':'centerY'
                }"
             >
             <div class="rect-tools">
             </div>
         </div>
    `,
    styles: `
        .draw-touch-input .hidden {
            display: none;
        }
        
        .draw-touch-input .action-button {
             width: 56px;
             height: 56px;
             border-radius: 50%;
             user-select: none;
             z-index: 10;
             position: absolute;
         }
    `,
    data: {
        actionDescription: 'TOOLS',
        centerX: 100,
        centerY: 100,
    },
    methods: {},
    mounted: function() {}
};