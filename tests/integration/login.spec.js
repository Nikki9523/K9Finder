require("dotenv").config();
const request = require("supertest");
const app = require("./../../server");

describe("Login API", () => {
  it("Success: returns a valid token when valid credentials are provided", async () => {
    const response = await request(app).post("/login").send({
      email: process.env.TEST_USERNAME_ADMIN,
      password: process.env.TEST_PASSWORD,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("Failure: returns an error when invalid credentials are provided", async () => {
    const response = await request(app).post("/login").send({
      email: process.env.TEST_USERNAME_ADMIN,
      password: "wrongpassword",
    });
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid email or password");
  });

  it("Failure: returns an error when email is not passed", async () => {
    const response = await request(app).post("/login").send({
      password: process.env.TEST_PASSWORD,
    });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Please provide both email and password for authentication");
  });
});