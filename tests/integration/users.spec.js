require("dotenv").config();
const request = require("supertest");
const app = require("./../../server");
const testUtils = require("../testUtils");
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
    expect(response.body).toEqual({ id: "001", name: "nicola", email: "nicolastack16@gmail.com" });
  });

  it("Failure : User cannot retrieve non-existant record", async () => {
    const response = await request(app).get("/users/nonexistent").set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(404);
  });
});

describe("Get Users", () => {
  it("Success : User can retrieve all users", async () => {
    const response = await request(app)
      .get("/users")
      .set("Authorization", AUTH_HEADER);
    console.log("Get Users response:", response.body);
    expect(response.status).toBe(200);
    console.log("Users retrieved:", response.body);
    expect(response.body).toEqual([
      { name: "nicola", email: "nicolastack16@gmail.com", id: "001" },
      { name: "bob", id: "002" },
      {
        name: "test delete",
        email: "nicolastack16+testdelete@gmail.com",
        id: "003",
      },
      { name: "jane", email: "nicolastack16+test@gmail.com", id: "004" },
    ]);
  });
});

describe("Create User in dynamoDB + Cognito", () => {

  afterEach(async () => {
    await testUtils.removeCognitoTestUser("nicolastack16+create@gmail.com");
  });

  it("Success : User can create a new user", async () => {
    const newUser = { 
      name: "Nikki", 
      email: "nicolastack16+create@gmail.com",
      password: process.env.TEST_PASSWORD
    };
    const response = await request(app)
      .post("/users")
      .send(newUser)
      .set("Authorization", AUTH_HEADER);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Nikki");
    expect(response.body.email).toBe("nicolastack16+create@gmail.com");
  });
});

describe("Update User", () => {
  afterEach(async () => {
    await testUtils.resetCognitoTestUser();
  });
  it("should update an existing user in cognito and dynamo", async () => {
    const existingUser = {
      id: "004",
      name: "jane",
      email: "nicolastack16+test@gmail.com",
    };

    const updatedUser = {
      email: existingUser.email,
      name: "Nikki",
      newEmail: "nicolastack16+updated@gmail.com",
    };
    console.log("Updating user:", existingUser.id, updatedUser);
    const response = await request(app)
      .put(`/users/${existingUser.id}`)
      .send(updatedUser)
      .set("Authorization", AUTH_HEADER);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(existingUser.id);
    expect(response.body.name).toBe("Nikki");
    expect(response.body.email).toBe(updatedUser.email);
  });
});

describe("Delete User", () => {
  beforeAll(async () => {
    await testUtils.createCognitoTestUserForDeletionTest(
      "nicolastack16+testdelete@gmail.com"
    );
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it("Success : User can delete a user", async () => {
    const user = { id: "003", name: "test delete" };
    console.log("Deleting user:", user.id);

    const response = await request(app)
      .delete(`/users/${user.id}`)
      .send({ email: "nicolastack16+testdelete@gmail.com" })
      .set("Authorization", AUTH_HEADER);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(user.id);

    const validateDynamoDBDeletion = await request(app)
      .get(`/users/${user.id}`)
      .set("Authorization", AUTH_HEADER);
    expect(validateDynamoDBDeletion.status).toBe(404);
  });
});