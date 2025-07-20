const { getUsers, createUser, deleteUser, updateUser, getDogs,deleteDog, createDog, updateDogDetails } = require('../../dynamo');
const { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

jest.mock('@aws-sdk/client-dynamodb', () => {
  const mClient = {
    send: jest.fn(),
  };
  return {
    DynamoDBClient: jest.fn(() => mClient),
    ScanCommand: jest.fn(),
    PutItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
    UpdateItemCommand: jest.fn(),
  };
});

describe("dynamo helpers", () => {
  let mClient;
  let errorSpy;

  beforeEach(() => {
    mClient = new DynamoDBClient();
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("Success getUsers returns user items", async () => {
    mClient.send.mockResolvedValue({
      Items: [
        { id: { S: "123abc" }, name: { S: "Anne" } },
        { id: { S: "456def" }, name: { S: "Sarah" } },
      ],
    });
    const users = await getUsers();
    const formattedUsers = users.map((user) => ({
      id: user.id.S,
      name: user.name.S,
    }));
    expect(formattedUsers).toEqual([
      { id: "123abc", name: "Anne" },
      { id: "456def", name: "Sarah" },
    ]);
    expect(mClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
  });

  it("Failure: user receives error message when getUsers fails", async () => {
    mClient.send.mockRejectedValue(new Error("Failure on getUsers"));
    await expect(getUsers()).rejects.toThrow("Could not get users");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error getting users:",
      expect.any(Error)
    );
  });

  it("Success: User creates new item", async () => {
    mClient.send.mockResolvedValue({});
    const user = { id: "456", name: "Bob", email: "test@test.com" };
    await expect(createUser(user)).resolves.toEqual(user);
    expect(mClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
  });

  it("Failure: error thrown when createUser fails", async () => {
    mClient.send.mockRejectedValue(new Error("CreateUser failed"));
    const user = { id: "789", name: "Sandy", email: "test@test.com" };
    await expect(createUser(user)).rejects.toThrow("Failed to create user");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error creating user:",
      expect.any(Error)
    );
  });

  it("Success: User can delete item", async () => {
    mClient.send.mockResolvedValue({});
    await expect(deleteUser("456")).resolves.toBeUndefined();
    expect(mClient.send).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
  });

  it("Failure: deleteUser throws error on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("Deletion Fails"));
    await expect(deleteUser("456")).rejects.toThrow("Failed to delete user");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error deleting user:",
      expect.any(Error)
    );
  });

  it("Success: user can update item", async () => {
    mClient.send.mockResolvedValue({
      Attributes: { id: { S: "456def" }, name: { S: "Sarah Updated" } },
    });
    const userId = "456def";
    const updatedUser = { name: "Sarah Updated" };
    const result = await updateUser(userId, updatedUser);
    expect(result).toEqual({
      Attributes: { id: { S: "456def" }, name: { S: "Sarah Updated" } },
    });
    expect(mClient.send).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
  });

  it("Failure: updateUser throws error on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("DynamoDB error"));
    const userId = "456";
    const updatedUser = { name: "Bob Updated" };
    await expect(updateUser(userId, updatedUser)).rejects.toThrow(
      "Failed to update user"
    );
    expect(mClient.send).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error updating user:",
      expect.any(Error)
    );
  });

  it("Success: getDogs returns dog items", async () => {
    mClient.send.mockResolvedValue({
      Items: [
        { id: { S: "dog1" }, name: { S: "Buddy" } },
        { id: { S: "dog2" }, name: { S: "Max" } },
      ],
    });
    const dogs = await getDogs();
    const formattedDogs = dogs.map((dog) => ({
      id: dog.id.S,
      name: dog.name.S,
    }));
    expect(formattedDogs).toEqual([
      { id: "dog1", name: "Buddy" },
      { id: "dog2", name: "Max" },
    ]);
    expect(mClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
  });

  it("Failure: getDogs throws error on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("DynamoDB error"));
    await expect(getDogs()).rejects.toThrow("Could not get dogs");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error getting dogs:",
      expect.any(Error)
    );
  });

  it("Success: updateDogDetails updates all fields", async () => {
    mClient.send.mockResolvedValue({});
    const dogId = "dog1";
    const updatedData = {
      name: "Buddy Updated",
      likes: ["fetch", "walks"],
      dislikes: ["cats"],
      age: 5,
    };
    await expect(updateDogDetails(dogId, updatedData)).resolves.toBeUndefined();
    expect(mClient.send).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
  });

  it("Success: updateDogDetails updates only some fields", async () => {
    mClient.send.mockResolvedValue({});
    const dogId = "dog2";
    const updatedData = {
      name: "Max Updated",
      // likes, dislikes, age omitted
    };
    await expect(updateDogDetails(dogId, updatedData)).resolves.toBeUndefined();
    expect(mClient.send).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
  });

  it("Failure: updateDogDetails throws error on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("DynamoDB error"));
    const dogId = "dog3";
    const updatedData = {
      name: "Error Dog",
      likes: ["run"],
      dislikes: ["water"],
      age: 2,
    };
    await expect(updateDogDetails(dogId, updatedData)).rejects.toThrow(
      "Failed to update dog"
    );
    expect(mClient.send).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error updating dog:",
      expect.any(Error)
    );
  });

  it("Failure: updateDogDetails throws error for unsupported type", async () => {
    mClient.send.mockRejectedValue(new Error("Unsupported type passed: 0"));
    const dogId = "dog4";
    const updatedData = {
      name: "Type Error Dog",
      likes: 0, // Invalid type
      dislikes: ["noise"],
      age: 3,
    };
    await expect(updateDogDetails(dogId, updatedData)).rejects.toThrow(
      "Failed to update dog"
    );
    expect(mClient.send).toHaveBeenCalledWith(expect.any(UpdateItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error updating dog:",
      expect.any(Error)
    );
  });
  it("Success: deleteDog deletes a dog item", async () => {
    mClient.send.mockResolvedValue({});
    await expect(deleteDog("D123")).resolves.toBeUndefined();
    expect(mClient.send).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
  });

  it("Failure: deleteDog throws error on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("Delete failed"));
    await expect(deleteDog("D123")).rejects.toThrow("Failed to delete dog");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(DeleteItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error deleting dog:",
      expect.any(Error)
    );
  });

  it("Success: createDog creates a dog item", async () => {
    mClient.send.mockResolvedValue({});
    const dog = {
      id: "D999",
      name: "Test Dog",
      adoptionStatus: "available",
      shelterId: "101010",
      breed: "Beagle",
      age: 3,
      gender: "Male",
      likes: ["fetch"],
      dislikes: ["cats"],
      goodWithChildren: true,
      adopterId: "adopter-123",
    };
    await expect(createDog(dog)).resolves.toBeUndefined();
    expect(mClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
  });

  it("Failure: createDog throws error on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("PutItem failed"));
    const dog = {
      id: "D999",
      name: "Test Dog",
      adoptionStatus: "available",
      shelterId: "101010",
      breed: "Beagle",
      age: 3,
      gender: "Male",
      likes: ["fetch"],
      dislikes: ["cats"],
      goodWithChildren: true,
      adopterId: "adopter-123",
    };
    await expect(createDog(dog)).rejects.toThrow("Failed to create dog");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
    expect(errorSpy).toHaveBeenCalledWith(
      "Error creating dog:",
      expect.any(Error)
    );
  });
});