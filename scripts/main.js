import app from './app.js';
import Step from './classes/Step.js';

// create store
import drawing from './stores/drawing.js';
app.createStore('drawing', drawing);

// import Canvas from './components/Canvas.js';
// import DrawStepSimplifiedInput from './components/DrawStepSimplifiedInput.js';
import DrawStepInput from './components/DrawStepInput.js';
import SvgCanvas from './components/SvgCanvas.js';
// import AddEntity from './components/AddEntity.js';

// app.createComponent('Canvas', Canvas);
//app.createComponent('DrawStepSimplifiedInput', DrawStepSimplifiedInput);
 app.createComponent('DrawStepInput', DrawStepInput);
app.createComponent('SvgCanvas', SvgCanvas);
// app.createComponent('AddEntity', AddEntity);

app.start();
