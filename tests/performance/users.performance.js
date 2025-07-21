import http from 'k6/http';
import { sleep } from 'k6';
import { check } from 'k6';

// eslint-disable-next-line no-undef
const token = __ENV.JWT_TOKEN;

export const options = {
  iterations: 1,
};


export default function () {
  let data = {
    name: "Jack Smith",
    email: "nicolastack16+perftest@gmail.com",
    // eslint-disable-next-line no-undef
    password: __ENV.password,
    userType: "adopter",
  };

  let res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users",
    JSON.stringify(data),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "POST /users status is 201": (r) => r.status === 201 });
  const userId = res.json().id;
  if (res.status !== 201) {
    console.log('Failed with error:', res.status, "error is", res.error, "res body is", res.body);
    return;
  }

  res = http.get("https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  check(res, { "GET /users status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    return;
  }

  res = http.put(`https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`, JSON.stringify({
    email: data.email,
    name: "Updated User Name",
    newEmail: "nicolastack16+updatedperf@gmail.com",
  }), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  check(res, { "PUT /users/:id status is 200": (r) => r.status === 200 });
  sleep(100);
  if (res.status !== 200) {
    console.log("response is", res);
    console.log('PUT user Failed with error:', res.error, res.status, "res body is", res.body);
    console.log("user id is ", userId);
    return;
  }
  res = http.get(`https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  console.log("GET before DELETE:", res.status, res.body);
  check(res, { "GET /dogs/:id status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    console.log('GET user Failed with error:', res.error, res.status, "res body is", res.body);
    return;
  }
  res = http.del(`https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`, JSON.stringify({
    email: "nicolastack16+updatedperf@gmail.com",
  }), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  check(res, { "DELETE /users/:id status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    console.log(
      "DELETE url:",
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`
    );
    console.log("DELETE response:", res.status, res.body);
    return;
  }
  sleep(1);
}