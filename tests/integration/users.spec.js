require("dotenv").config();
const request = require("supertest");
const app = require("./../../server");
const testUtils = require("../testUtils");
const cognitoUsername = process.env.TEST_USERNAME_2;
let AUTH_HEADER;

const { seedTestData, teardownTestData, createTableIfNotExists } = require("../testUtils");

beforeAll(async () => {
  const token = await testUtils.generateBearerTokenForIntegrationTests();
  AUTH_HEADER = `Bearer ${token}`;
});

beforeEach(async () => {
  await createTableIfNotExists();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

describe("Get Specific existing User", () => {
  it("Success : User can retrieve existing user", async () => {
    const response = await request(app).get("/users/001").set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "001", name: "nicola" });
  });

  it("Failure : User cannot retrieve non-existant record", async () => {
    const response = await request(app).get("/users/nonexistent").set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(404);
  });
});

describe("Get Users", () => {
  it("Success : User can retrieve all users", async () => {
    const response = await request(app).get("/users").set("Authorization", AUTH_HEADER);
    console.log("Get Users response:", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: "001",
        name: "nicola",
      },
      {
        id: "002",
        name: "bob",
      },
    ]);
  });
});


describe("Create User in dynamoDB + Cognito", () => {

  afterEach(async () => {
    await testUtils.removeCognitoTestUser();
  });

  it("Success : User can create a new user", async () => {
    const newUser = { 
      name: "Nikki", 
      email: cognitoUsername,
      password: process.env.TEST_PASSWORD
    };
    const response = await request(app)
      .post("/users")
      .send(newUser)
      .set("Authorization", AUTH_HEADER);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Nikki");
    expect(response.body.email).toBe(cognitoUsername);
  });
});

describe("Update User", () => {
  it("Success : User can update an existing user", async () => {
    const existingUser = { id: "001", name: "nicola" };
    const updatedUser = { name: "Nikki" };
    const response = await request(app).put(`/users/${existingUser.id}`).send(updatedUser).set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(existingUser.id);
    expect(response.body.name).toBe("Nikki");
  });
});

describe("Delete User", () => {
  it("Success : User can delete a user", async () => {
    const user = { id: "001", name: "nicola" };
    const response = await request(app).delete(`/users/${user.id}`).set("Authorization", AUTH_HEADER);
    console.log("Delete response:", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(user.id);

    const getResponse = await request(app).get(`/users/${user.id}`).set("Authorization", AUTH_HEADER);
    expect(getResponse.status).toBe(404);
  });
});