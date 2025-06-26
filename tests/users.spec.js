const request = require("supertest");
const app = require("../server");


// describe("Get Specific existing User", () => {
//   it("Success : User can retrieve existing user", async () => {
//     const response = await request(app).get("/users/1234");
//     expect(response.status).toBe(200);
//     expect(response.body).toEqual({ id: "1234", name: "Nicola" });
//   });

//   it("Failure : User cannot retrieve non-existant record", async () => {
//     const response = await request(app).get("/users/nonexistent");
//     expect(response.status).toBe(404);
//   });
// });

describe("Get Users", () => {
  it("Success : User can retrieve all users", async () => {
    const response = await request(app).get("/users");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: "456",
        name: "dbA",
      },
      {
        id: "123",
        name: "nicola",
      },
    ]);
  });
});


// describe("Create User", () => {
//   it("Success : User can create a new user", async () => {
//     const newUser = { name: "Alice Smith" };
//     const response = await request(app).post("/users").send(newUser);
//     expect(response.status).toBe(201);
//     expect(response.body).toHaveProperty("id");
//     expect(response.body.name).toBe("Alice Smith");
//   });
// });