//실습코드 3-7. Todo 컴포넌트
//Todo 리스트를 위해 첫번째로 Todo Component를 만든다. 이 컴포넌트는 checkbox와 label을 렌더링 하는 컴포넌트다.

import React from 'react'
//실습코드 3-10. constructor(props){}내에는 Todo 컴포넌트에 item 매개변수 넘기기.
class Todo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {item: props.item};
      }

      
      render() {
        return (
          <div className="Todo">
            <input
              type="checkbox"
              id={this.state.item.id}
              name={this.state.item.id}
              checked={this.state.item.done}
              />
            <label id={this.state.item.id}>{this.state.item.title}</label>
          </div>
        );
      }
    }
    export default Todo;
    

// 하기는 3-10. 실습을 위해 주석처리함.
// render() {
//     return (
//         <div className="Todo">
//             <input type="checkbox" id="todo0" name="todo0" value="todo0"/>
//             <label for ="todo0">Todo 컴포넌트 만들기</label>
//         </div>
//         );
//     }
// }
// export default Todo;