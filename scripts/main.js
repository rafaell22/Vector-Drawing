import { App } from 'https://cdn.jsdelivr.net/gh/rafaell22/UI-Framework@0.0.34/App.js';
import Step from './classes/Step.js';

import Canvas from './components/Canvas.js';
import DrawStepInput from './components/DrawStepInput.js';
// import DrawTouchInput from './components/DrawTouchInput.js';
import SvgCanvas from './components/SvgCanvas.js';

import drawing from './stores/drawing.js';

const app = new App();

app.createStore('drawing', drawing);

// app.createComponent('Canvas', Canvas);
// app.createComponent('DrawStepInput', DrawStepInput);
// app.createComponent('DrawTouchInput', DrawTouchInput);
// app.createComponent('SvgCanvas', SvgCanvas);

console.log(app);
app.start();
