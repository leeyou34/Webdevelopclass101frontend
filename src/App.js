//import logo from './logo.svg'; // 12월 27일 잠시 주석처리함... 
import './App.css';
//실습코드 3-8. App 컴포넌트에서 Todo 컴포넌트 사용하기.
import Todo from './Todo'; // 실습코드 3-8. todo component를 위해 추가됨.
import React from 'react';
//실습코드 3-11. App에서 Todo로 item 넘겨주기
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      item: {id:0, title: "Hello World 1", done: true },
    };
  }

  render() {
    return (
      <div className="App">
        <Todo item={this.state.item}/>
      </div>
    );
  }
}

export default App;


// //실습코드 3-8을 위한 코드.
// class App extends React.Component {
//   render() {
//     return (
//       <div className="App">
//         <Todo />
//         <Todo />
//       </div>
//     );
//   //상기 <Todo /> 중 두번째 것은 실습 코드 3-9. App.js에서 Todo 컴포넌트 두번 추가 하고자 추가됨.
// }
// }


//
// 3-8. 실습코드를 위해 하기를 주석 처리로 함. 주석처리 단축키 (Crt + //)
//
// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }
//export default App;
