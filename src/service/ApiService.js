/*======================================================================
* Dec 29th 2021, 실습코드 3-42. ApiService.js 
* (page222. 여기 이페이지에 오타가 있는 것 같다.)
* ApiService.js에 백엔드로 요청을 보낼 때 사용할 유틸리티 함수를 작성한다.
======================================================================*/

import { API_BASE_URL } from "../app-config"; // app-config의 이름이 api-config로 바뀔수 있음... 추후 고민해야함...
const ACCESS_TOKEN = "ACCESS_TOKEN"; // 실습코드 5-11. ApiService.js  액세스 토큰 헤더에 추가.

export function call (api, method, request) {
    /*==========================================
    * 실습코드 5-11. ApiService.js 액세스 토큰 헤더에 추가
    * 로그인에 관련되지 않는 모든 API콜은 call 메서드를 통해 이뤄지고 
    * 반복을 피하려면, call에 토큰이 존재하는 경우 헤더에 추가하는 로직 작성
    ============================================*/ 
    let headers = new Headers({
        "Content-Type": "application/json",
    });
    // 로컬 스토리지에서 ACCESS_TOKEN 가져오기
    const accessToken = localStorage.getItem("ACCESS_TOKEN");
        if(accessToken && accessToken !== null) {
            headers.append("Authorization", "Bearer" + accessToken);
        }
    let options = { //jan 3rd const options -> let options로 변경. 일단... https://github.com/fsoftwareengineer/todo-application/discussions/9   링크 참고
        //headers: new Headers({ // 실습코드 5-11.을 위해 주석처리
        //    "Content-Type": "application/json",
        //}),
        headers: headers,
        url: API_BASE_URL + api,
        method: method,
    };
    if (request) {
        //GET METHOD
        options.body = JSON.stringify(request);
    }
    return fetch(options.url, options)
        .then((response) =>
            response.json().then((json) => {
                if (!response.ok) {
                    // response.ok가 true이면 정상적인 응답을 받을 것이고 아니면 에러 응답을 받은 것임.
                    return Promise.reject(json);
                }
                return json;
            })
        )
    /*=========================================
    * Jan 10th 2022, 실습코드 5-5 ApiService.js에서 catch & redirect
    * call method는 결국 fetch 메서드를 부른다. 이 fetch 메서드를
    * 사용하기 위해서는. API를 콜하고 . then을 이용해 그 결과를 받아 올 수 있다.
    * 그런제 만약 에러 response가 리턴된다면 우리는 3.3.3.절의 '자바스크립트 Promise'
    * 에서 catch 메서드를 사용해 에러를 받아 볼 수 있다. 
    * 따라서, 이 catch 메서드 안에서 상태 코드를 분석해 403 forbidden경우, 
    * login페이지로 리다이렉트가 가능하다.
    *
    ===========================================*/
        .catch((error) => {
            //추가 된 부분
            console.log(error.status);
            if (error.status === 403) {
                window.location.href = "/login"; //redirect
            }
            return Promise.reject(error); 
            // Jan 10th 2022, 책에는 return Promise.reject(json); 로 되어있으나,
            // discussion을 참고하여 return Promise.reject(error); 로 변경.
            }
        );
}

    /*===============================================
    * Jan 10th 2022, 실습코드 5-6 ApiService에서 signin 함수.
    * 로그인 API 서비스는 /auth/signin 이다. 이 경로를 이용해 로그인하는 메서드를
    * ApiService.js에 작성한다. 로그인 서비스 함수를 작성해보자.
    * 
    =================================================*/ 

export function signin(userDTO) { 
    return call("/auth/signin", "POST", userDTO).then((response) => {
        //    console.log("response : ", response); // 실습코드 5-8을 위해 주석처리
        //    alert("로그인 토큰: " + response.token); // 실습코드 5-8을 위해 주석처리
    
        /*===============================
        * Jan 10th 2022, 실습코드 5-8 로그인 성공 시 메인 화면으로 리디렉트
        * ApiService.js의 signin 함수를 수정 
        ================================*/
        if(response.token) {
            localStorage.setItem("ACCESS_TOKEN", response.token); // 실습코드 5-10. 액세스 코드 저장.
            // token이 존재하는 경우 Todo 화면으로 리디렉트
            window.location.href = "/";
        }
    });
}

    /*===============================================
    * Jan 10th 2022, 실습코드 5-12 로그아웃 서비스
    * 비록 백엔드 서버에 요청하는 로직은 아니지만,
    * 코드 관리를 위해 로컬 스토리지에 관련된 모든 것은 ApiService에 작성
    * 하기는 signout 함수
    =================================================*/ 

export function signout() {
    localStorage.setItem(ACCESS_TOKEN, null);
    window.location.href = "/login";
}

    /*===============================================
    * Jan 11th 2022, 실습코드 5-15 계정생성 로직 ApiService에 signup 함수 추가
    * ApiService에 signup 메서드 추가.
    * 이 메서드를 이용해 백엔드에 signup 요청을 보낸다.
    =================================================*/ 

export function signup(userDTO) {
    return call("/auth/signup", "POST", userDTO);
}