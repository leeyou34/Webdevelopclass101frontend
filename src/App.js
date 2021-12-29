//import logo from './logo.svg'; // 12월 27일 잠시 주석처리함... 
import './App.css';
import Todo from './Todo'; // 실습코드 3-8. App 컴포넌트에서 Todo 컴포넌트 사용하기... todo component를 위해 추가됨.
import React from 'react';
import AddTodo from './AddTodo.js'; // 실습코드 3-16. App.js에 AddTodo 컴포넌트 추가.
import {Paper, List, Container} from "@material-ui/core"; // 실습코드 3-16. App.js에 AddTodo 컴포넌트 추가.
import { call } from "./service/ApiService"; // 실습코드 3-43. App 컴포넌트에서 ApiService 사용


class App extends React.Component {
  constructor(props) {
    super(props); 
    this.state = {
      items: [
        // 실습코드 3-29. App.js에서 items를 빈 리스트로 초기화  
        //{id: "0", title: "Hello World 1", done: true},
        //{id: "1", title: "Hello World 2", done: false},
        // add와 delete 라는 기본적인 기능이 있어서 상기 id: "0" blah blah는 주석처리됨.
      ],
    };
  }
  //================함수 추가 영역 시작====================================================
  /*
  *=================================================
  * Dec 28th 2021
  * 실습코드 3-18. App.js에서 add함수 추가.
  */

  //  (1) 함수 추가
  // add = (item) => {
  //   const thisItems = this.state.items;
  //   item.id = "ID-" + thisItems.length; //key를 위한 id 추가
  //   item.done = false; // done 초기화
  //   thisItems.push(item); // 리스트에 아이템 추가
  //   this.setState({ items: thisItems }); // 업데이트는 반드시 this.setState로 해야됨
  //   console.log("items : ", this.state.items);
  // }
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

  //  (1) 함수 추가
  // delete = (item) => {
  //   const thisItems = this.state.items;
  //     console.log("Before Update Items : ", this.state.items)
  //   const newItems = thisItems.filter(e => e.id !== item.id);
  //   this.setState({ items: newItems }, () => {
  //     //디버깅 콜백
  //     console.log("Update Items : ", this.state.items)
  //   });
  // }
  /*
  * 함수 추가 끝.
  *==================================================
  */
   /*
  *=================================================
  * 3.3 서비스 통합
  * 실습코드 3-39. App 컴포넌트에 componentDidMount() 함수 추가.
  * 마운팅 과정에서 constructor와 render 함수를 부르는데 마운팅을 마친 후 바로 부르는 함수가 하나더 있다.
  * 그것이 바로 componentDidMount함수이다.
  */
  // componentDidMount() {
  //   const requestOptions = {
  //     method: "GET",
  //     headers: { "Content-Type": "application/json" },
  //   };

  //   fetch("http://localhost:8080/todo", requestOptions)
  //     .then((response) => response.json())
  //     .then(
  //       (response) => {
  //         this.setState({
  //           items: response.data,
  //         });
  //       },
  //       (error) => {
  //         this.setState({
  //           error,
  //         });
  //       }
  //     );
  // }
  /*
  * 함수 추가 끝. // 3-39. componentDidMount()함수는 3-43. 컴포넌트를 위해 잠시 주석처리 함.
  *==================================================
  */
   /*
  *=================================================
  * 3.3.2 corse : Cross Origin Resource Sharing 
  * 실습코드 3-43. App 컴포넌트에 ApiService 사용.
  * ApiService에서 작성한 call method를 사용하면 아주 간단하게 APi를 콜 할 수 있다.
  */
  componentDidMount() {
      call("/todo", "GET", null).then((response) =>
        this.setState({ items: response.data})
      );
    }
    add = (item) => {
      call("/todo", "POST", item).then((response) =>
        this.setState({ items: response.data })
        );
    }

    delete = (item) => {
      call("/todo", "DELETE", item).then((response) =>
        this.setState({ items: response.data })
        );
    };
  //===============함수 추가 영역 끝 ===============================
   /*
  *=================================================
  * 3.3.2 corse : Cross Origin Resource Sharing 
  * 실습코드 3-44. App 컴포넌트에 update 함수 구현
  * ApiService에서 작성한 call method를 사용하면 아주 간단하게 APi를 콜 할 수 있다.
  */

    update = (item) => {
      call("/todo", "PUT", item).then((response) =>
        this.setState({ items: response.data })
        );
    };

  //===============함수 추가 영역 끝 ===============================
  //===============렌더 영역 시작===================================
  
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
              delete={this.delete}
            // delete 함수 연결 끝.
            /* 실습코드 3-45. Todo의 props에 연결 해 주기...
            * update 함수 연결 시작.
            */
              update={this.update}
            // update 함수 연결 끝.  
            />
          ))}
        </List>
      </Paper>
    );

    return (
      <div className="App">
        <Container maxWidth="md">
          <AddTodo add={this.add} /*this add={this.add} section was omitted on 실습코드3-18. add함수 추가 *//>   
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
