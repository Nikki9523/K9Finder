// https://grafana.com/docs/k6/latest/get-started/write-your-first-test/

import http from 'k6/http';
import { sleep, check } from 'k6';

// eslint-disable-next-line no-undef
const password = __ENV.TEST_PASSWORD;

export const options = {
  iterations: 1,
  vu: 1
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
    console.log('Failed with error:', res.status, "error is", res.error, "res body is", res.body);
    throw new Error('Login failed');
  }
  const token = res.json().token;

  // Create a user
  res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users",
    JSON.stringify({
      name: "Test User",
      email: "nicolastack16+createtestdata@gmail.com",
      password: password,
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

  // // Create a shelter
  res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users",
    JSON.stringify({
      name: "Test Shelter",
      email: "nicolastack16+perftestshelter@gmail.com",
      password: password,
      userType: "shelter",
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const shelterId = res.json().id;

  // Create a dog for get dog + deletion
  res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs",
    JSON.stringify({
      id: `D${Date.now()}${Math.floor(Math.random() * 1000)}`,
      name: "Hector",
      age: 8,
      breed: "Scottie Terrier",
      gender: "Female",
      adoptionStatus: "available",
      shelterId: "12345",
      likes: ["walks"],
      dislikes: ["rain"],
      goodWithChildren: true,
      goodWithOtherDogs: true,
      adopterId: "12345",
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "POST /dogs status is 201": (r) => r.status === 201 });
  if (res.status !== 201) {
    console.log('Failed with error:', res.status, "error is", res.error, "res body is", res.body);
    throw new Error('Dog creation failed');
  }
  const dogId = res.json().id;

  // Create a dog for update dog
  res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs",
    JSON.stringify({
      id: `D${Date.now()}${Math.floor(Math.random() * 1000)}`,
      name: "Hector",
      age: 8,
      breed: "Scottie Terrier",
      gender: "Female",
      adoptionStatus: "available",
      shelterId: "12345",
      likes: ["walks"],
      dislikes: ["rain"],
      goodWithChildren: true,
      goodWithOtherDogs: true,
      adopterId: "12345",
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  const dogIdForUpdate = res.json().id;

  return { dogId, dogIdForUpdate, userId, shelterId };
}

export default function (userData) {

  const { userId, shelterId, dogId, dogIdForUpdate, token } = userData;

  let res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs",
    JSON.stringify({
      id: `D${Date.now()}${Math.floor(Math.random() * 1000)}`,
      name: "Hector",
      age: 8,
      breed: "Scottie Terrier",
      gender: "Female",
      adoptionStatus: "available",
      shelterId: shelterId,
      likes: ["walks"],
      dislikes: ["rain"],
      goodWithChildren: true,
      goodWithOtherDogs: true,
      adopterId: userId,
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  check(res, { "POST /dogs status is 201": (r) => r.status === 201 });
  if (res.status !== 201) {

    console.log('Failed with error:', res.status, "error is", res.error, "res body is", res.body);
    return;
  }

  res = http.get("https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  check(res, { "GET /dogs status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    return;
  }

  res = http.put(`https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/${dogIdForUpdate}`, JSON.stringify({
    name: "Updated Dog Name",
    age: 3,
    breed: "Updated Breed",
    likes: ["updated like"],
    dislikes: ["updated dislike"],
  }), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  check(res, { "PUT /dogs/:id status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    console.log('PUT dog Failed with error:', res.error, res.status, "res body is", res.body);
    return;
  }
  res = http.get(`https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/${dogId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  check(res, { "GET /dogs/:id status is 200": (r) => r.status === 200 });
  if (res.status !== 200) {
    console.log('GET dog Failed with error:', res.error, res.status, "res body is", res.body);
    return;
  }
  res = http.del(`https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/${dogId}`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  check(res, { "DELETE /dogs/:id status is 204": (r) => r.status === 204 });
  if (res.status !== 204) {
    console.log('DELETE dog Failed with error:', res.error, res.status, "res body is", res.body);
    return;
  }
  sleep(1);
}

export function teardown(data) {
  const { userId, shelterId, dogId, dogIdForUpdate, token } = data;

  // Delete the created dogs
  if (dogId) {
    let res = http.del(
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/${dogId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Teardown DELETE /dogs/:id", dogId, res.status);
  }
  if (dogIdForUpdate) {
    let res = http.del(
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/${dogIdForUpdate}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Teardown DELETE /dogs/:id", dogIdForUpdate, res.status);
  }

  // Delete the created shelter
  if (shelterId) {
    let res = http.del(
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${shelterId}`,
      JSON.stringify({ email: `nicolastack16+perftestshelter@gmail.com` }),
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    console.log("Teardown DELETE /users/:id (shelter)", shelterId, res.status);
  }

  // Delete the created user
  if (userId) {
    let res = http.del(
      `https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/users/${userId}`,
      JSON.stringify({ email: `nicolastack16+createtestdata@gmail.com` }),
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    console.log("Teardown DELETE /users/:id (user)", userId, res.status);
  }
}