const { getUsers, createUser, deleteUser, updateUser } = require('../../dynamo');
const { DynamoDBClient, ScanCommand, PutItemCommand, DeleteItemCommand,UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

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
  beforeEach(() => {
    mClient = new DynamoDBClient();
    jest.clearAllMocks();
  });

  it("Success getUsers returns user items", async () => {
    mClient.send.mockResolvedValue({
      Items: [
        { id: { S: "123abc" }, name: { S: "Anne" } },
        { id: { S: "456def" }, name: { S: "Sarah" } },
      ],
    });
    const users = await getUsers();
    const formattedUsers = users.map(user => ({
      id: user.id.S,
      name: user.name.S,
    }));
    expect(formattedUsers).toEqual([{ id: "123abc", name: "Anne" }, { id: "456def", name: "Sarah" }]);
    expect(mClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
  });

  it("Failure: user receives error message when getUsers fails", async () => {
    mClient.send.mockRejectedValue(new Error("Failure on getUsers"));
    await expect(getUsers()).rejects.toThrow("Could not get users");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
  });

  it("Success: User creates new item", async () => {
    mClient.send.mockResolvedValue({});
    const user = { id: "456", name: "Bob" };
    await expect(createUser(user)).resolves.toBeUndefined();
    expect(mClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
  });

  it("Failure: Error received on DynamoDB failure", async () => {
    mClient.send.mockRejectedValue(new Error("CreateUser failed"));
    const user = { id: "789", name: "Sandy" };
    await expect(createUser(user)).rejects.toThrow("Failed to create user");
    expect(mClient.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
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
  });

  it("Success: user can update item", async () => {
    mClient.send.mockResolvedValue({ Attributes: { id: { S: "456def" }, name: { S: "Sarah Updated" } } });
    const userId = "456def";
    const updatedUser = { name: "Sarah Updated" };
    const result = await updateUser(userId, updatedUser);
    expect(result).toEqual({ Attributes: { id: { S: "456def" }, name: { S: "Sarah Updated" } } });
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
  });
});