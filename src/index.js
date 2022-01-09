import React from 'react'; // 리액트의 사용을 위해 import (예제 3-9)
import ReactDOM from 'react-dom'; // 리액트 DOM의 사용을 위해
import './index.css'; // css import
//import App from './App'; //App component import // 예제 3-9
import AppRouter from './AppRouter'; //AppRouter component is imported (실습코드 5-4)
import reportWebVitals from './reportWebVitals'; // 지금은 무시해도 됨

ReactDOM.render( // ReactDOM이 내부의 컴포넌트들을 'root' 엘리멘트에 render함 // App Component 사용법
//  <React.StrictMode> // Jan 9th, 실습코드 5-4를 위해 해당 index.js React부분 주석
//    <App />
//  </React.StrictMode>,

/*=========================================
* Jan 9th 2022, 실습코드 5-4 index.js 수정
* 이제 경로에 따라 실행되는 컴포넌트가 다름으로, 
* 그정보를 갖고 있는 AppRouter를 가장 먼저 렌더링 해야함.
* index.js로 가서 맨 처음 렌더링 되는 컴포넌트가 AppRouter 컴포넌트가 되겠금 수정
*
==========================================*/
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>,
document.getElementById('root')
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
