const { DynamoDBClient, PutItemCommand,ScanCommand, UpdateItemCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

require('dotenv').config();

const isLocal = process.env.IS_LOCAL === 'true';

const dynamoClient = new DynamoDBClient({
  region: "us-east-1",
  ...(isLocal && {
    endpoint: "http://localhost:8000"
  })
});

const TABLE_NAME = "k9finder";


const getUsers = async () => {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: "NOT begins_with(#id, :idPrefix)",
    ExpressionAttributeNames: { "#id": "id" },
    ExpressionAttributeValues: { ":idPrefix": { S: "D" } },
  };

  try {
    const users = await dynamoClient.send(new ScanCommand(params));
    return users.Items;
  } catch (error) {
    console.error("Error getting users:", error);
    throw new Error("Could not get users");
  }
};

const createUser = async (user) => {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: { S: user.id },
      type: { S: "user" },
      name: { S: user.name },
      email: { S: user.email }
    }
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
    return { id: user.id, name: user.name, email: user.email, userType: user.userType };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};
// https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html#DDB-UpdateItem-request-AttributeUpdates

const updateUser = async (userId, updatedUser) => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: { S: userId }
    },
    UpdateExpression: "set #name = :name",
    ExpressionAttributeNames: {
      "#name": "name"
    },
    ExpressionAttributeValues: {
      ":name": { S: updatedUser.name }
    },
    ReturnValues: "UPDATED_NEW"
  };
  try {
    const result = await dynamoClient.send(new UpdateItemCommand(params));
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error("Failed to update user");
  }
};

const deleteUser = async (userId) => {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: { S: userId },
    }
  };

  try {
    await dynamoClient.send(new DeleteItemCommand(params));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error("Failed to delete user");
  }
};

const getDogs = async () => {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: "begins_with(#id, :idPrefix)",
    ExpressionAttributeNames: { "#id": "id" },
    ExpressionAttributeValues: { ":idPrefix": { S: "D" } },
  };

  try {
    const dogs = await dynamoClient.send(new ScanCommand(params));
    return dogs.Items;
  } catch (error) {
    console.error("Error getting dogs:", error);
    throw new Error("Could not get dogs");
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, getDogs };