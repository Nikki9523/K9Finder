
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });
const {CreateTableCommand, DescribeTableCommand, DeleteTableCommand, PutItemCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const testData = require('../seed-data.json');

require('dotenv').config();

async function generateBearerTokenForIntegrationTests() {
  if (
    !process.env.COGNITO_CLIENT_ID ||
    !process.env.TEST_USERNAME ||
    !process.env.TEST_PASSWORD ||
    !process.env.SECRET_HASH
  ) {
    throw new Error(
      "Missing required values for generating token. Please set COGNITO_CLIENT_ID, TEST_USERNAME, TEST_PASSWORD, and SECRET_HASH in your environment variables."
    );
  }
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: process.env.TEST_USERNAME,
      PASSWORD: process.env.TEST_PASSWORD,
      SECRET_HASH: process.env.SECRET_HASH,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const data = await cognito.send(command);
    return data.AuthenticationResult.IdToken;
  } catch (err) {
    console.error("Error initiating auth:", err);
    throw err;
  }
}

const isLocal = process.env.IS_LOCAL === 'true';

const dynamoClient = new DynamoDBClient({
  region: "us-east-1",
  ...(isLocal && {
    endpoint: "http://localhost:8000"
  })
});

const TABLE_NAME = "k9finder";

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

module.exports = { generateBearerTokenForIntegrationTests, seedTestData, teardownTestData, createTableIfNotExists };