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
    IconButton,
    } from "@material-ui/core";
import DeleteOutlined from "@material-ui/icons/DeleteOutlined";

  /* 
  *==================================================
  */

class Todo extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            item: props.item,
            readOnly: true // 실습코드 3-30. Todo.js에서 readOnly 상태 변수 추가.
        };
        /*
        * 실습코드 3-26. Todo.js에서 delete() 함수 연결
        * 함수 연결 시작
        */
       this.delete = props.delete;
       // 함수 연결 끝
       // 실습코드 3-46. Todo 컴포넌트에서 update 연결 및 사용
       this.update = props.update; // update를 this.update에 할당함.
       // 함수 연결 끝
    }

    //===========함수 추가 영역 시작======================
    /*
    * 실습코드 3-27. Todo.js에서 delete() 함수 추가
    * 함수 추가
    */
    deleteEventHandler = () => {
        this.delete(this.state.item)
    }
    // 함수 추가 끝.

    /*
    * 실습코드 3-31. Todo.js에서 offReadOnlyMode() 함수 추가
    * 함수 추가
    */
    offReadOnlyMode = () => {
        console.log("Event!", this.state.readOnly)
        this.setState({ readOnly: false}, () => {
            console.log("ReadOnly? ", this.state.readOnly)
        });
    }
    // 함수 추가 끝.

    /*
    * 실습코드 3-33. Todo.js에서 enterKeyEventHandler() 함수 작성
    * 함수 추가
    */

    enterKeyEventHandler = (e) => {
        if (e.key === "Enter") {
            this.setState({ readOnly: true});
            //실습코드 3-46. update연결 및 사용
            this.update(this.state.item); //엔터를 누르면 저장
            // 적용 끝.
        }
    };
    // 함수 추가 끝.

    /*
    * 실습코드 3-35. Todo.js에서 editEventHandler() 작성
    * 함수 추가
    */

    editEventHandler = (e) => {
        const thisItem = this.state.item;
        thisItem.title = e.target.value;
        this.setState({ item: thisItem });
    }
    // 함수 추가 끝.    

    /*
    * 실습코드 3-37. Todo.js에서 checkBoxEventHandler 작성
    * 함수 추가
    */

    checkboxEventHandler = (e) => {
        const thisItem = this.state.item;
        thisItem.done = !thisItem.done;
        this.setState({ item: thisItem });
        // 실습코드 3-46. update 연결 및 사용.
        this.update(this.state.item); // 체크박스가 변경되면 저장.
    }
    // 함수 추가 끝.    
    
    //==============함수 추가 영역 끝=====================
    //==============render 영역 시작=====================
    render() {
        const item = this.state.item;
        return ( 
            <ListItem> 
                <Checkbox checked={item.done}  
                          disableRipple /* 실습코드 3-23. disableRipple 추가됨*/
                          onChange={this.checkboxEventHandler} /* 실습코드 3-38. Todo.js에서 onChange에 checkboxEventHandler 연결 */
                /> 
                <ListItemText>
                    <InputBase
                        inputProps={{ 
                            "aria-label": "naked",
                            readOnly: this.state.readOnly, //실습코드 3-32. Todo.js에서 readOnly와 OffReadOnlyMode 연결
                        }}
                        onClick={this.offReadOnlyMode}// 실습코드 3-32. Todo.js에서 readOnly와 OffReadOnlyMode 연결
                        type="text"
                        id={item.id}  //각 리스트를 구분하려고 id를 연결
                        name={item.id} // 각 리스트를 구분하려고 id를 연결
                        value={item.title}
                        multiline={true}
                        fullWidth={true}
                        onKeyPress={this.enterKeyEventHandler} //실습코드 3-34. Todo.js에서 onKeyPress에 enterKeyEventHandler 연결
                        onChange={this.editEventHandler} // 실습코드 3-36. Todo.js에서 onChange에 editEventHandler 연결.
                    />
                </ListItemText>
                <ListItemSecondaryAction /*실습코드 3-23. DeleteOutlined 추가됨 */>
                    <IconButton 
                        aria-label="Delete Todo"
                        /*
                        * 실습코드 3-28. Todo.js에서 delete() 함수 작성
                        * 함수 작성 시작.
                        */
                        onClick={this.deleteEventHandler}
                        /* 함수 작성 끝 */>
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