/*============================================================
* Jan 8th 2022.
* 실습코드 5-2.로그인 컴포넌트 
* 라우팅의 테스팅을 위해 기능이 없는 src/Login.js를 추가
* 이 로그인 컴포넌트는 렌터링할 컴포넌트다.
============================================================*/

import { Button, TextField } from "@material-ui/core";
import React from "react";
import { signin } from "./service/ApiService";
// 하기는 실습코드 5-7.를 위한 import library임.
import { Grid, Typography} from "@material-ui/core";
import { Container } from "@material-ui/core"
// 실습코드 5-7. library add 끝.
// 실습코드 5-18. 로그인 컴포넌트 수정
import {
    Link
} from "@material-ui/core";
// 실습코드 5-18. 컴포넌트 수정 끝.

class Login extends React.Component {
    constructor(props) {
        super(props);
        /*===============================================
        * Jan 10th 2022, 실습코드 5-7 Login 컴포넌트 수정.
        * 로그인 컴포넌트는 이메일과 패스워드를 받는 인풋 필드와 로그인 버튼으로 이뤄져 있다. 
        * 사용자가 이메일과 패스워드를 입력한 후 로그인 버튼을 클릭하면 백엔드의
        * /auth/signin으로 요청이 전달 된다.
        ================================================*/
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        const data = new FormData(event.target);
        const email = data.get("email");
        const password = data.get("password");
        // ApiService의 signin 메서드를 사용해 로그인
        signin({ email: email, password: password});
    }

    render() {
        //return <p>로그인 페이지</p>; //실습코드 5-7을 위해 주석처리함.
        return (
            <Container component="main" maxWidth="xs" style={{ marginTop: "8%"}}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography component="h1" variant="h5">
                            Login
                        </Typography>
                    </Grid>
                </Grid>
                <form noValidate onSubmit={this.handleSubmit}>
                    {" "}
                    {/* submit 버튼을 클릭하면 handleSubmit이 실행됨 */}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                id="email"
                                label="이메일 주소"
                                name="email"
                                autoComplete="email"
                                />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                variant="outlined"
                                required
                                fullWidth
                                name="password"
                                label="패스워드"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                >
                                로그인
                                </Button>
                        </Grid>
                        <Link href="/signup" variant="body2"/*실습코드5-18. 로그인 컴포넌트 부분 추가.*/> 
                            <Grid item/*실습코드5-18. 로그인 컴포넌트 부분 추가.*/>계정이 없습니까? 여기서 가입하세요.</Grid>
                        </Link>
                    </Grid>
                </form>
            </Container>
        );
    }
}
// 실습코드 5-7 끝.
export default Login;