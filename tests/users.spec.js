const request = require("supertest");
const app = require("../server");

const { seedTestData, teardownTestData, createTableIfNotExists } = require("../dynamo");

beforeEach(async () => {
  await createTableIfNotExists();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

describe("Get Specific existing User", () => {
  it("Success : User can retrieve existing user", async () => {
    const response = await request(app).get("/users/001");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "001", name: "nicola" });
  });

  it("Failure : User cannot retrieve non-existant record", async () => {
    const response = await request(app).get("/users/nonexistent");
    expect(response.status).toBe(404);
  });
});

describe("Get Users", () => {
  it("Success : User can retrieve all users", async () => {
    const response = await request(app).get("/users");
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


describe("Create User", () => {
  it("Success : User can create a new user", async () => {
    const newUser = { name: "Alice Smith" };
    const response = await request(app).post("/users").send(newUser);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Alice Smith");
  });
});

describe("Update User", () => {
  it("Success : User can update an existing user", async () => {
    const existingUser = { id: "001", name: "nicola" };
    const updatedUser = { name: "Nikki" };
    const response = await request(app).put(`/users/${existingUser.id}`).send(updatedUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(existingUser.id);
    expect(response.body.name).toBe("Nikki");
  });
});