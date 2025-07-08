const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, DeleteTableCommand, PutItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const testData = require('./seed-data.json');

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
    TableName: TABLE_NAME
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
      name: { S: user.name }
    }
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
};

// functions for testing

const createTableIfNotExists = async () => {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log("Table already exists.");
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      const params = {
        TableName: TABLE_NAME,
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" }
        ],
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      };
      await dynamoClient.send(new CreateTableCommand(params));
      console.log("Table created.");
    } else {
      throw err;
    }
  }
};

const seedTestData = async () => {
  const items = testData.k9finder.map(data => data.PutRequest.Item);
  if (items.length === 0) {
    console.log("No test data found in seed-data.json");
  }

  for (const item of items) {
    const params = {
      TableName: "k9finder",
      Item: item,
    };
    try {
      await dynamoClient.send(new PutItemCommand(params));
      console.log(`Seeded item: ${JSON.stringify(item)}`);
    } catch (error) {
      console.error("Error seeding test data:", error);
      throw new Error("Could not seed test data");
    }
  }
};

const teardownTestData = async () => {
  try {
    await dynamoClient.send(
      new DeleteTableCommand({ TableName: TABLE_NAME })
    );
    console.log("Table deleted successfully.");
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log("Table does not exist, nothing to teardown.");
      return;
    } else if (err.name === "failed to delete table") {
      console.error("Failed to delete table, it may not exist or there was an error.");
      return;
    } else {
      throw err;
    }
  }
};

module.exports = { getUsers, createUser, seedTestData, teardownTestData, createTableIfNotExists };