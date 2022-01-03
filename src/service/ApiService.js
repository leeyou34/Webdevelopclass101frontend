/*
* Dec 29th 2021, 실습코드 3-42. ApiService.js 
* (page222. 여기 이페이지에 오타가 있는 것 같다.)
* ApiService.js에 백엔드로 요청을 보낼 때 사용할 유틸리티 함수를 작성한다.
*/

import { API_BASE_URL } from "../app-config"; // app-config의 이름이 api-config로 바뀔수 있음... 추후 고민해야함...

export function call (api, method, request) {
    let options = { //jan 3rd const options -> let options로 변경. 일단... https://github.com/fsoftwareengineer/todo-application/discussions/9   링크 참고
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        url: API_BASE_URL + api,
        method: method,
    };
    if (request) {
        //GET METHOD
        options.body = JSON.stringify(request);
    }
    return fetch(options.url, options).then((response) =>
        response.json().then((json) => {
            if (!response.ok) {
                // response.ok가 true이면 정상적인 응답을 받을 것이고 아니면 에러 응답을 받은 것임.
                return Promise.reject(json);
            }
            return json;
        })
    );
}