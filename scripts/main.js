import { App } from 'https://cdn.jsdelivr.net/gh/rafaell22/UI-Framework@0.0.35/App.js';
import Step from './classes/Step.js';

// import Canvas from './components/Canvas.js';
import DrawStepSimplifiedInput from './components/DrawStepSimplifiedInput.js';
// import DrawTouchInput from './components/DrawTouchInput.js';
import SvgCanvas from './components/SvgCanvas.js';
// import AddEntity from './components/AddEntity.js';


import drawing from './stores/drawing.js';

const app = new App();

app.createStore('drawing', drawing);

// app.createComponent('Canvas', Canvas);
app.createComponent('DrawStepSimplifiedInput', DrawStepSimplifiedInput);
// app.createComponent('DrawTouchInput', DrawTouchInput);
app.createComponent('SvgCanvas', SvgCanvas);
// app.createComponent('AddEntity', AddEntity);

app.start();
