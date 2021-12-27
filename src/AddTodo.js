// 실습코드 3-15. AddTodo.js Todo에 추가 모듈을 만들려고 src 아래에 AddTodo.js 를 생성함.
// 실습코드 3-16에서는 UI부분의 코드를 구현할 것임
import React from "react";
import { TextField, Paper, Button, Grid } from "@material-ui/core";

class AddTodo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {item: {title: ""} }; // 사용자의 입력을 저장할 오브젝트
    }

    render() {
        return (
            <Paper style={{ margin: 16, padding: 16}}>
                <Grid container>
                    <Grid xs={11} md={11} item style={{ paddingRight: 16}}>
                        <TextField placeholder="Add Todo here" fullWidth />
                    </Grid>
                    <Grid x={1} md={1} item>
                        <button fullWidth color="secondary" variant="outlined">
                            +
                        </button>
                    </Grid>
                </Grid>
            </Paper>
        );
    }
}

export default AddTodo;