// https://grafana.com/docs/k6/latest/get-started/write-your-first-test/

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
    id: "D1020",
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
  };

  let res = http.post(
    "https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs",
    JSON.stringify(data),
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

  res = http.put("https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/D1020", JSON.stringify({
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
  res = http.get("https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/D1020", {
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
  res = http.del("https://jo0vpfwya1.execute-api.us-east-1.amazonaws.com/dogs/D1020", null, {
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