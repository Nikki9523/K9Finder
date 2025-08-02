require("dotenv").config();
const request = require("supertest");
const app = require("./../../server");
const testUtils = require("../testUtils");
let AUTH_HEADER;

const { seedTestData, teardownTestData, createTableIfNotExists } = require("../testUtils");

const password = "password";
const password2 = "password";
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
});

describe("Dogs API", () => {
  it("Success: user can get dogs", async () => {
    const response = await request(app)
      .get("/dogs")
      .set("Authorization", AUTH_HEADER);

    expect(response.statusCode).toBe(200);
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
  it("should return a specific dog by ID", async () => {
    const response = await request(app)
      .get("/dogs/D123")
      .set("Authorization", AUTH_HEADER);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
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
    });
  });
});

it("should return 404 for non-existent dog ID", async () => {
  const response = await request(app)
    .get("/dogs/nonexistent")
    .set("Authorization", AUTH_HEADER);

  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ error: "Dog not found" });
});

it("Success: user can update all details of specific dog", async () => {
  const updatedDog = {
    name: "Updated Poochy",
    age: 4,
    likes: ["fetch"],
    dislikes: ["cats", "swimming"],
    adopterId: "248814d8-00d1-707d-3f83-dbb749859424",
    adoptionStatus: "adopted",

  };
  const response = await request(app)
    .put("/dogs/D789")
    .set("Authorization", AUTH_HEADER)
    .send(updatedDog);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({
    id: "D789",
    name: "Updated Poochy",
    age: 4,
    breed: "Beagle",
    dislikes: ["cats", "swimming"],
    adopterId: "248814d8-00d1-707d-3f83-dbb749859424",
    adoptionStatus: "adopted",
    gender: "Male",
    goodWithChildren: false,
    goodWithOtherDogs: true,
    likes: ["fetch"],
    shelterId: "101010"
  });
});

it("Success: User can update specific fields of dog details", async () => {
  const updatedDog = {
    name: "Updated Chicky",
    age: 6,
    breed: "Chihuahua",
    dislikes: ["loud noises"],
    likes: ["sleeping"],
  };
  const response = await request(app)
    .put("/dogs/D456")
    .set("Authorization", AUTH_HEADER)
    .send(updatedDog);
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({
    adopterId: "248814d8-00d1-707d-3f83-dbb749859424",
    adoptionStatus: "reserved",
    goodWithChildren: true,
    goodWithOtherDogs: false,
    gender: "Male",
    name: "Updated Chicky",
    dislikes: ["loud noises"],
    id: "D456",
    shelterId: "101010",
    breed: "Chihuahua",
    age: 6,
    likes: ["sleeping"],
  });
});

it("Failure: should return 404 for updating non-existent dog ID", async () => {
  const updatedDog = {
    name: "Non-existent Dog",
  };
  const response = await request(app)
    .put("/dogs/nonexistent")
    .set("Authorization", AUTH_HEADER)
    .send(updatedDog);
  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ error: "Dog not found" });
});

it("should delete a dog by ID", async () => {
  const response = await request(app)
    .delete("/dogs/D123")
    .set("Authorization", AUTH_HEADER);
  expect(response.statusCode).toBe(204);
  const getResponse = await request(app)
    .get("/dogs/D123")
    .set("Authorization", AUTH_HEADER);
  expect(getResponse.statusCode).toBe(404);
  expect(getResponse.body).toEqual({ error: "Dog not found" });
});

it("should return 404 for deleting non-existent dog ID", async () => {
  const response = await request(app)
    .delete("/dogs/nonexistent")
    .set("Authorization", AUTH_HEADER);
  expect(response.statusCode).toBe(404);
  expect(response.body).toEqual({ error: "Dog not found" });
}
);

it("should create a new dog", async () => {
  const newDog = {
    id: "D1020",
    name: "Hector",
    age: 8,
    breed: "Scottie Terrier",
    dislikes: ["rain"],
    gender: "Female",
    adoptionStatus: "available",
    goodWithChildren: true,
    goodWithOtherDogs: true,
    likes: ["lazing around"],
    shelterId: "12345",
  };
  const response = await request(app)
    .post("/dogs")
    .set("Authorization", AUTH_HEADER)
    .send(newDog);
  expect(response.statusCode).toBe(201);
  expect(response.body).toEqual(expect.objectContaining(newDog));
});

it("should return 400 for creating a dog with missing fields", async () => {
  const newDog = {
    id: "D999",
    name: "New Dog",
    age: 1,
    breed: "Golden Retriever",
    dislikes: ["cats", "loud noises"],
  };
  const response = await request(app)
    .post("/dogs")
    .set("Authorization", AUTH_HEADER)
    .send(newDog);
  expect(response.statusCode).toBe(400);
  expect(response.body).toEqual({ error: "Missing required fields" });
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