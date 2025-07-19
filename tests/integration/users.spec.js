require("dotenv").config();
const request = require("supertest");
const app = require("./../../server");
const testUtils = require("../testUtils");
let AUTH_HEADER;

const { seedTestData, teardownTestData, createTableIfNotExists } = require("../testUtils");

// beforeAll(async () => {
//   const token = await testUtils.generateBearerTokenForIntegrationTests(userType);
//   AUTH_HEADER = `Bearer ${token}`;
// });

beforeEach(async () => {
  await createTableIfNotExists();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

//try refactor tests to make them more DRY

describe("Get Specific existing User as admin", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests("admin");
    AUTH_HEADER = `Bearer ${token}`;
  });
  it("Success : User can retrieve existing user", async () => {
    const response = await request(app)
      .get("/users/248814d8-00d1-707d-3f83-dbb749859424")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "248814d8-00d1-707d-3f83-dbb749859424",
      name: "nicola",
      email: "nicolastack16@gmail.com",
      userType: "adopter"
    });
  });

  it("Failure : User cannot retrieve non-existant record", async () => {
    const response = await request(app)
      .get("/users/nonexistent")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(404);
  });
});

describe("Get Specific existing User as shelter user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "shelter"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });

  it("Success : Shelter User can retrieve existing adopter user", async () => {
    const response = await request(app)
      .get("/users/248814d8-00d1-707d-3f83-dbb749859424")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "248814d8-00d1-707d-3f83-dbb749859424",
      name: "nicola",
      email: "nicolastack16@gmail.com",
      userType: "adopter"
    });
  });
  it("Success : Shelter User can retrieve their own details", async () => {
    const response = await request(app)
      .get("/users/12345")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: "12345",
      name: "Waterford Dog Adoption Shelter",
      userType: "shelter",
      email: "nicolastack16+shelter1@gmail.com"
    });
  });
  it("Failure: Shelter User cannot get list of other shelters", async () => {
    const response = await request(app)
      .get("/users/shelters")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });
  });
});

describe("Get Specific existing User as adopter user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "adopter"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });

  describe("Get specific user as adopter user", () => {
    beforeAll(async () => {
      const token = await testUtils.generateBearerTokenForIntegrationTests(
        "adopter"
      );
      AUTH_HEADER = `Bearer ${token}`;
    });
    it("Success : Adopter User can retrieve their own details", async () => {
      const response = await request(app)
        .get("/users/248814d8-00d1-707d-3f83-dbb749859424")
        .set("Authorization", AUTH_HEADER);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: "248814d8-00d1-707d-3f83-dbb749859424",
        name: "nicola",
        email: "nicolastack16@gmail.com",
        "userType": "adopter"
      });
    });
    it("Failure : Adopter User cannot retrieve another user's details", async () => {
      const response = await request(app)
        .get("/users/3456")
        .set("Authorization", AUTH_HEADER);
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: "Forbidden" });
    });
  });
});

describe("Get Users with adopter userType as admin user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "admin"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });

  it("Success : User can retrieve all users", async () => {
    const response = await request(app)
      .get("/users")
      .set("Authorization", AUTH_HEADER);
    console.log("Get Users response:", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([                                                                
      {
        name: 'nicola',
        id: '248814d8-00d1-707d-3f83-dbb749859424',
        userType: 'adopter',
        email: 'nicolastack16@gmail.com'
      },
      {
        name: 'Waterford Dog Adoption Shelter',
        id: '12345',
        userType: 'shelter',
        email: 'nicolastack16+shelter1@gmail.com'
      },
      {
        name: 'Cody Smith',
        id: '78910',
        userType: 'admin',
        email: 'nicolastack16+admin@gmail.com'
      },
      { name: 'bob', id: '002' },
      {
        name: 'test delete',
        email: 'nicolastack16+testdelete@gmail.com',
        id: '003'
      },
      {
        name: 'Ron Weasley',
        id: '3456',
        userType: 'adopter',
        email: 'nicolastack16+adopter@gmail.com'
      },
      {
        name: 'jane',
        id: '004',
        userType: 'adopter',
        email: 'nicolastack16+test@gmail.com'
      },
      {
        name: 'Carlow Dog Adoption Shelter',
        id: '101010',
        userType: 'shelter',
        email: 'nicolastack16+shelter2@gmail.com'
      }
    ]);
  });
});

describe("Get Users with shelter userType as admin user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "admin"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });
  it("Success : Admin User can retrieve all shelter users", async () => {
    const response = await request(app)
      .get("/users/shelters")
      .set("Authorization", AUTH_HEADER);
    console.log("Get Shelter Users response:", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        name: "Waterford Dog Adoption Shelter",
        id: "12345",
        userType: "shelter",
        email: "nicolastack16+shelter1@gmail.com"
      },
      {
        name: "Carlow Dog Adoption Shelter",
        id: "101010",
        userType: "shelter",
        email: "nicolastack16+shelter2@gmail.com"
      }
    ]);
  });
});

describe("Get Users with adopter userType as shelter user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "shelter"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });
  it("Success : Shelter User can retrieve all adopter users", async () => {
    const response = await request(app)
      .get("/users/adopters")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    console.log("Get Adopter Users response:", response.body);
    expect(response.body).toEqual([                                                        
      {
        name: 'nicola',
        id: '248814d8-00d1-707d-3f83-dbb749859424',
        userType: 'adopter',
        email: 'nicolastack16@gmail.com'
      },
      {
        name: 'Ron Weasley',
        id: '3456',
        userType: 'adopter',
        email: 'nicolastack16+adopter@gmail.com'
      },
      {
        name: 'jane',
        id: '004',
        userType: 'adopter',
        email: 'nicolastack16+test@gmail.com'
      }
    ]);
  });
});

describe("Get Users with shelter userType as adopter user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "adopter"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });

  it("Success : Adopter User can retrieve all shelter users", async () => {
    const response = await request(app)
      .get("/users/shelters")
      .set("Authorization", AUTH_HEADER);
    console.log("Get Shelter Users response:", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        name: "Waterford Dog Adoption Shelter",
        id: "12345",
        userType: "shelter",
        email: "nicolastack16+shelter1@gmail.com",
      },
      {
        name: "Carlow Dog Adoption Shelter",
        id: "101010",
        userType: "shelter",
        email: "nicolastack16+shelter2@gmail.com",
      },
    ]);
  });
});

describe("Failure: Get Users with adopter userType as adopter user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "adopter"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });
  it("Failure : Adopter User cannot retrieve all adopter users", async () => {
    const response = await request(app)
      .get("/users/adopters")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });
  });
});

describe("Failure: Get Users with shelter userType as shelther user", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "shelter"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });
  it("Failure : Shelter User cannot retrieve all shelter users", async () => {
    const response = await request(app)
      .get("/users/shelters")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Forbidden" });
  });
});

describe("Create User in dynamoDB + Cognito", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "admin"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });

  afterEach(async () => {
    await testUtils.removeCognitoTestUser("nicolastack16+create@gmail.com");
  });

  it("Success : User can create a new user", async () => {
    const newUser = {
      name: "Nikki",
      email: "nicolastack16+create@gmail.com",
      password: process.env.TEST_PASSWORD,
      userType: "adopter",
    };
    const response = await request(app)
      .post("/users")
      .send(newUser)
      .set("Authorization", AUTH_HEADER);

    console.log("Create User response:", response.body);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Nikki");
    expect(response.body.email).toBe("nicolastack16+create@gmail.com");
  });
});

describe("Update User", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "admin"
    );
    AUTH_HEADER = `Bearer ${token}`;
  });
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

    console.log("response:", response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toBe(existingUser.id);
    expect(response.body.name).toBe("Nikki");
    expect(response.body.email).toBe(updatedUser.email);
  });
});

describe("Delete User", () => {
  beforeAll(async () => {
    const token = await testUtils.generateBearerTokenForIntegrationTests(
      "admin"
    );
    AUTH_HEADER = `Bearer ${token}`;
    await testUtils.createCognitoTestUserForDeletionTest(
      "nicolastack16+testdelete@gmail.com"
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
