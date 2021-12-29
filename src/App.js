//import logo from './logo.svg'; // 12월 27일 잠시 주석처리함... 
import './App.css';
//실습코드 3-8. App 컴포넌트에서 Todo 컴포넌트 사용하기.
import Todo from './Todo'; // 실습코드 3-8. todo component를 위해 추가됨.
import React from 'react';
// 실습코드 3-16. App.js에 AddTodo 컴포넌트 추가.
import AddTodo from './AddTodo.js';
import {Paper, List, Container} from "@material-ui/core";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [
        {id: "0", title: "Hello World 1", done: true},
        {id: "1", title: "Hello World 2", done: false},
      ],
    };
  }
  /*
  *=================================================
  * Dec 28th 2021
  * 실습코드 3-18. App.js에서 add함수 추가.
  */

  //  (1) 함수 추가
  add = (item) => {
    const thisItems = this.state.items;
    item.id = "ID-" + thisItems.length; //key를 위한 id 추가
    item.done = false; // done 초기화
    thisItems.push(item); // 리스트에 아이템 추가
    this.setState({ items: thisItems }); // 업데이트는 반드시 this.setState로 해야됨
    console.log("items : ", this.state.items);
  }
  /*
  * 함수 추가 끝.
  *==================================================
  */
  /*
  *=================================================
  * Dec 29th 2021
  * 실습코드 3-24. App.js에서 delete() 함수 작성.
  * 전체 Todo 리스트는 App.js에서 관리하기 때문에 delete() 함수는 App.js에 작성해야 함.
  */

  //  (2) 함수 추가
  delete = (item) => {
    const thisItems = this.state.items;
      console.log("Before Update Items : ", this.state.items)
    const newItems = thisItems.filter(e => e.id !== item.id);
    this.setState({ items: newItems }, () => {
      //디버깅 콜백
      console.log("Update Items : ", this.state.items)
    });
  }
  /*
  * 함수 추가 끝.
  *==================================================
  */
  render(){
    var todoItems = this.state.items.length > 0 && (
      <Paper style={{ margin: 16}}>
        <List>
          {this.state.items.map((item, idx) => (
            <Todo 
              item={item}
              key={item.id}
            /* 실습코드 3-25. App.js Todo의 delete에 연결.
            * delete 함수 연결
            */
              delete={this.delete}  />
            // delete 함수 연결 끝.
          ))}
        </List>
      </Paper>
    );

    return (
      <div className="App">
        <Container maxWidth="md">
          <AddTodo />  
          <div className="TodoList">{todoItems}</div>
        </Container>
      </div>
    );
  }
}

export default App;

//============================================================
// // 실습코드 3-14. material-ui를 이용한 App 컴포넌트 디자인
// import { Paper, List } from "@material-ui/core";

// class App extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       items: [
//         {id: "0", title: "Hello World 1", done: true},
//         {id: "1", title: "Hello World 2", done: false},
//       ],
//     };
//   }

//   render(){
//     var todoItems = this.state.items.length > 0 && (
//       <Paper style={{ margin: 16}}>
//         <List>
//           {this.state.items.map((item, idx) => (
//             <Todo item={item} key={item.id} />
//           ))}
//         </List>
//       </Paper>
//     );

//     return <div className="App">{todoItems}</div>
//   }
// }
// export default App;

//==============================================================
// //실습코드 3-12. Todo 아이템 리스트 렌더링...
// class App extends React.Component {
//   constructor(props) {
//     super(props);
//     // (1) item -> items 배열로...
//     this.state = {
//       items: [
//         { id: "0", title: "Hello World 1", done: true },
//         { id: "1", title: "Hello World 2", done: false},
//       ],
//     };
//   }
//   render() {
//     // (2) 자바스크립트가 제공하는 map 함수를 이용해 배열을 반복해 <Todo... / > 컴포넌트 생성.
//     var todoItems = this.state.items.map((item, idx) => (
//       <Todo item={item} key={item.id} />
//     ));

//     // (3) 생성된 컴포넌트 리턴
//     return <div className="App">{todoItems}</div>;
//   }
// }
// export default App;


//===============================================================
// //실습코드 3-11. App에서 Todo로 item 넘겨주기
// class App extends React.Component {
//   constructor(props){
//     super(props);
//     this.state = {
//       item: {id:0, title: "Hello World 1", done: true },
//     };
//   }

//   render() {
//     return (
//       <div className="App">
//         <Todo item={this.state.item}/>
//       </div>
//     );
//   }
// }

// export default App;

//===============================================================
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
