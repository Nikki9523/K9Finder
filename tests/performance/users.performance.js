import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  iterations: 1,
  vus: 1
};

export function setup() {
  // call login route to generate token
  let res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/login",
    JSON.stringify({
      // eslint-disable-next-line no-undef
      email: __ENV.TEST_USERNAME_ADMIN,
      // eslint-disable-next-line no-undef
      password: __ENV.TEST_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "POST /login status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    console.log(
      "Failed with error:",
      res.status,
      "error is",
      res.error,
      "res body is",
      res.body
    );
    throw new Error("Login failed");
  }
  const token = res.json().token;

  // Create a user for get and delete
  res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users",
    JSON.stringify({
      name: "Test User",
      email: `nicolastack16+createtestdata${Date.now()}@gmail.com`,
      // eslint-disable-next-line no-undef
      password: __ENV.TEST_PASSWORD,
      userType: "adopter",
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const userId = res.json().id;
  const email1 = res.json().email;

  // create a user for update
  res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users",
    JSON.stringify({
      name: "Test User 2",
      email: `nicolastack16+createtestdata${Date.now()}@gmail.com`,
      // eslint-disable-next-line no-undef
      password: __ENV.TEST_PASSWORD,
      userType: "adopter",
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const userId2 = res.json().id;
  const email2 = res.json().email;
  return { userId, userId2, email1, email2, token };
};


export default function (userData) {
  const {userId, userId2, email1, email2, token} = userData;

  if (!token) {
    console.error("Token is not defined");
    return;
  }

  let data = {
    name: "Jack Smith",
    email: `nicolastack16+createtestdata${Date.now()}@gmail.com`,
    // eslint-disable-next-line no-undef
    password: __ENV.TEST_PASSWORD,
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
  const userId3 = res.json().id;
  if (res.status !== 201) {
    console.log(
      "Failed with error:",
      res.status,
      "error is",
      res.error,
      "res body is",
      res.body
    );
  }

  res = http.get(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  check(res, { "GET /users status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    return;
  }

  res = http.put(
    `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId2}`,
    JSON.stringify({
      email: email2,
      name: "Updated User Name",
      newEmail: `nicolastack16+updatedperf${Date.now()}@gmail.com`,
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "PUT /users/:id status is 200": (r) => r.status === 200 });
  sleep(100);
  if (res.status !== 200) {
    console.log(
      "PUT user Failed with error:",
      res.error,
      res.status,
      "res body is",
      res.body
    );
    console.log("user id is ", userId);
    return;
  }
  res = http.get(
    `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "GET /users/:id status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    console.log(
      "GET user Failed with error:",
      res.error,
      res.status,
      "res body is",
      res.body
    );
    return;
  }
  res = http.del(
    `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`,
    JSON.stringify({
      email: email1,
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "DELETE /users/:id status is 200": (r) => r.status === 200 });
  console.log("Deleting user with id", userId, "response is", res.status);
  if (res.status !== 200) {
    console.log("DELETE response:", res.status, res.body);
    return;
  }

  // try cleanup created user

  if (userId3) {
    let delRes = http.del(
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId3}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Deleted userId3 in default:", userId3, delRes.status);
  }

  sleep(1);
}


export function teardown(data) {
  const userId2 = data.userId2;
  const token = data.token;

  if (userId2) {
    let res = http.del(
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId2}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Teardown DELETE /users/:id", userId2, res.status);
  }
}