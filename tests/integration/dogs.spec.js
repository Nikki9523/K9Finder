require("dotenv").config();
const request = require("supertest");
const app = require("./../../server");
const testUtils = require("../testUtils");
let AUTH_HEADER;

const { seedTestData, teardownTestData, createTableIfNotExists } = require("../testUtils");


beforeEach(async () => {
  await createTableIfNotExists();
  await seedTestData();
});

afterAll(async () => {
  await teardownTestData();
});

beforeAll(async () => {
  const token = await testUtils.generateBearerTokenForIntegrationTests("admin");
  AUTH_HEADER = `Bearer ${token}`;
  console.log("Generated AUTH_HEADER for tests:", AUTH_HEADER);
});

describe("Dogs API", () => {
  it("should return a success message for GET /dogs", async () => {
    const response = await request(app)
      .get("/dogs")
      .set("Authorization", AUTH_HEADER);

    expect(response.statusCode).toBe(200);
    console.log("Response body:", response.body);
    expect(response.body).toEqual([
      {
        adopterId: "248814d8-00d1-707d-3f83-dbb749859424",
        adoptionStatus: "adopted",
        age: 1,
        breed: "Labrador",
        dislikes: ["cats", "fireworks"],
        gender: "Female",
        goodWithChildren: true,
        goodWithOtherDogs: true,
        id: "D123",
        likes: ["playing", "training"],
        name: "Bailey",
        shelterId: "12345",
      },
      {
        adoptionStatus: "available",
        age: 3,
        breed: "Beagle",
        dislikes: ["cats", "swimming"],
        gender: "Male",
        goodWithChildren: false,
        goodWithOtherDogs: true,
        id: "D789",
        likes: ["fetch"],
        name: "Poochy",
        shelterId: "101010",
      },
      {
        adopterId: "248814d8-00d1-707d-3f83-dbb749859424",
        adoptionStatus: "reserved",
        age: 5,
        breed: "Chihuahua",
        dislikes: ["cats", "loud noises"],
        gender: "Male",
        goodWithChildren: true,
        goodWithOtherDogs: false,
        id: "D456",
        likes: ["short walks", "sleeping"],
        name: "Chicky",
        shelterId: "101010",
      },
    ]);
  });
});

describe("Unauthorized access to Dogs API", () => {
  it("should return 401 when token is missing", async () => {
    const response = await request(app).get("/dogs");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe(
      "Missing or invalid Authorization header"
    );
  });
});