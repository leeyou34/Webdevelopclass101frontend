/*============================================================
* Jan 8th 2022.
* 실습코드 5-2.로그인 컴포넌트 
* 라우팅의 테스팅을 위해 기능이 없는 src/Login.js를 추가
* 이 로그인 컴포넌트는 렌터링할 컴포넌트다.
============================================================*/

import React from "react";

class Login extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <p>로그인 페이지</p>;
    }
}

export default Login;