const request = require("supertest");
const app = require("../server");


describe("Get Specific existing User", () => {
  it("Success : User can retrieve existing user", async () => {
    const response = await request(app).get("/users/1234");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "1234", name: "Nicola" });
  });
});