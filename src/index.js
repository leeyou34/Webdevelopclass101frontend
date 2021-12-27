import React from 'react'; // 리액트의 사용을 위해 import (예제 3-9)
import ReactDOM from 'react-dom'; // 리액트 DOM의 사용을 위해
import './index.css'; // css import
import App from './App'; //App component import
import reportWebVitals from './reportWebVitals'; // 지금은 무시해도 됨

ReactDOM.render( // ReactDOM이 내부의 컴포넌트들을 'root' 엘리멘트에 render함 // App Component 사용법
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
