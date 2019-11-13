import { createElement } from 'react';
import { createRoot, render } from 'react-dom';
import 'antd/dist/antd.css';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const container = document.getElementById('root');
createRoot(container).render(createElement(App));
// render(createElement(App), container);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
