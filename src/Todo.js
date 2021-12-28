//실습코드 3-7. Todo 컴포넌트
//Todo 리스트를 위해 첫번째로 Todo Component를 만든다. 이 컴포넌트는 checkbox와 label을 렌더링 하는 컴포넌트다.

import React from 'react';
// //실습코드 3-13. material ui를 이용한 Todo Component 디자인.
// import { ListItem, ListItemText, InputBase, Checkbox } from "@material-ui/core";

  /*
  *=================================================
  * 실습코드 3-23. Todo.js에서 material-ui 컴포넌트 import
  */
import {
    ListItem,
    ListItemText,
    InputBase,
    Checkbox,
    ListItemSecondaryAction,
    IconButton
    } from "@material-ui/core";
import DeleteOutlined from "@material-ui/icons/DeleteOutlined";

  /* 
  *==================================================
  */

class Todo extends React.Component {
    constructor(props) {
        super(props);
        this.state = { item: props.item};
    }

    render() {
        const item = this.state.item;
        return ( 
            <ListItem> 
                <Checkbox checked={item.done} /* 실습코드 3-23. disableRipple 추가됨*/ disableRipple/> 
                <ListItemText>
                    <InputBase
                        inputProps={{ "aria-label": "naked"}}
                        type="text"
                        id={item.id}  //각 리스트를 구분하려고 id를 연결
                        name={item.id} // 각 리스트를 구분하려고 id를 연결
                        value={item.title}
                        multiline={true}
                        fullWidth={true}
                    />
                </ListItemText>
                <ListItemSecondaryAction /*실습코드 3-23. DeleteOutlined 추가됨 */>
                    <IconButton aria-label="Delete Todo">
                        <DeleteOutlined />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>
        );
    }
}
export default Todo;

// //실습코드 3-10. constructor(props){}내에는 Todo 컴포넌트에 item 매개변수 넘기기.
// class Todo extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {item: props.item};
//       }
      

//       render() {
//         return (
//           <div className="Todo">
//             <input
//               type="checkbox"
//               id={this.state.item.id}
//               name={this.state.item.id}
//               checked={this.state.item.done}
//               />
//             <label id={this.state.item.id}>{this.state.item.title}</label>
//           </div>
//         );
//       }
//     }
//     export default Todo;
    

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