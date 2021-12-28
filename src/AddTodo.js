//실습코드 3-17. AddTodo.js에 onInputChange 함수 작성 Dec 28th 2021.
import React from "react";
import {TextField, Paper, Button, Grid} from "@material-ui/core";

class AddTodo extends React.Component {
    constructor(props) {
        super(props);
        this.state = { item: { title: "" } };
    }
    //  (1) 함수 작성
    onInputChange = (e) => {
        const thisItem = this.state.item;
        thisItem.title = e.target.value;
        this.setState({ item: thisItem });
        console.log(thisItem);
    }

    render() {
    //  (2) 함수 연결
    return (
            <Paper style={{ margin: 16, padding: 16}}>
                <Grid container>
                    <Grid xs={11} md={11} item style={{ paddingRight: 16}}>
                        <TextField
                            placeholder="Add Todo here"
                            fullWidth
                            onChange={this.onInputChange}
                            value={this.state.item.title}
                        />
                    </Grid>
                    <Grid xs={1} md={1} item>
                        <Button fullWidth
                            color="secondary"
                            variant="outlined">
                                +
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            );
        }
    }
export default AddTodo;
// // 실습코드 3-15. AddTodo.js Todo에 추가 모듈을 만들려고 src 아래에 AddTodo.js 를 생성함.
// // 실습코드 3-16에서는 UI부분의 코드를 구현할 것임
// import React from "react";
// import { TextField, Paper, Button, Grid } from "@material-ui/core";

// class AddTodo extends React.Component {
//     constructor(props) {
//         super(props);
//         this.state = {item: {title: ""} }; // 사용자의 입력을 저장할 오브젝트
//     }

//     render() {
//         return (
//             <Paper style={{ margin: 16, padding: 16}}>
//                 <Grid container>
//                     <Grid xs={11} md={11} item style={{ paddingRight: 16}}>
//                         <TextField placeholder="Add Todo here" fullWidth />
//                     </Grid>
//                     <Grid x={1} md={1} item>
//                         <button fullWidth color="secondary" variant="outlined">
//                             +
//                         </button>
//                     </Grid>
//                 </Grid>
//             </Paper>
//         );
//     }
// }

// export default AddTodo;