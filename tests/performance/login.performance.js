import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  iterations: 1,
  vus: 1,
  thresholds: {
    http_req_failed: ["rate<0.25"],
    http_req_duration: ["p(95)<1000"],
  },
};

// write test for login
export default function () {
  let res = http.post("https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/login", JSON.stringify({
    // eslint-disable-next-line no-undef
    email: __ENV.TEST_USERNAME_ADMIN,
    // eslint-disable-next-line no-undef
    password: __ENV.TEST_PASSWORD
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
  check(res, { "login successful": (r) => r.status === 200 });
  sleep(1);
}