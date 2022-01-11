/*============================================================
* Jan 8th 2022.
* 실습코드 5-3.AppRouter 컴포넌트 
* Login 컴포넌트로 라우팅할 수 있는  src/AppRoute.js를 추가
* AppRoute.js에 모든 라우팅 규칙을 작성한다.
============================================================*/

import React from "react";
import "./index.css";
import App from "./App";
import Login from "./Login";
//import { BrowserRouter as Router, Switch, Route } from "react-router-dom"; // Jan 9th 2022, react-router-dom 버젼 6.2.1사유로 Switch가 적용이 안됨.
import { BrowserRouter, Router, Routes, Route } from "react-router-dom";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

import SignUp from "./SignUp"; // 실습코드 5-17. AppRouter에 SignUp 라우트 추가.

// Jan 9th 2022, below function and class were added by thomas lee

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {"Copyright © "}
            Thomasleeyou34, {new Date().getFullYear()}
            {"."}
        </Typography>
    );
}

class AppRouter extends React.Component {
    render() {
        return (
            //====================================As-IS
            // 실습코드 5-3 AppRouter.js에서 Switch 태그가 react-router-dom에 적용되지 않아 주석처리함.
            // <div>
            //     <Router>
            //         <div>
            //             <Switch>
            //                 <Route path="/login">
            //                     <Login />
            //                 </Route>
            //                 <Route path="/">
            //                     <App />
            //                 </Route>
            //             </Switch>
            //         </div>
            //         <Box mt={5}>
            //             <Copyright />
            //         </Box>
            //     </Router>
            // </div>
            //=======================================
            //=======================================To-Be
            //<Switch>태그가 <Routes로 변환됨> https://github.com/fsoftwareengineer/todo-application/discussions/29
            <BrowserRouter /*added*/> 
            <div>
                <Router>
                    <div>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<SignUp />} />
                            <Route path="/" element={<App />} />
                        </Routes>
                    </div>
                    <Box mt={5}>
                        <Copyright />
                    </Box>
                </Router>
            </div>
            </BrowserRouter>
        );
    }
}
/*=================================
* Jan 10th 2022. 실습코드 5-4 변경사항. (https://github.com/sijune/todo-frontend/blob/master/src/AppRoute.js#L8) 참고
*   <Routes> ==> <Switch>에서 Routes로 변경됨. 
*        <Route path="/login" element={<Login />} />
*        <Route path="/" element={<App />} />
*    </Routes>
* 기존 페이지 289와는 조금 다름.
===================================*/

export default AppRouter;


