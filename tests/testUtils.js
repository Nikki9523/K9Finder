require('dotenv').config();
const { CognitoIdentityProviderClient,InitiateAuthCommand,AdminDeleteUserCommand, AdminUpdateUserAttributesCommand, AdminCreateUserCommand, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });
const {CreateTableCommand, DescribeTableCommand, DeleteTableCommand, PutItemCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { addUserToGroupInCognito } = require("../cognito");
const testData = require("../seed-data.json");
const crypto = require("crypto");

const generateSecretHash = (username, clientId, clientSecret) => {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

async function generateBearerTokenForIntegrationTests(userType) {
  const clientId = process.env.COGNITO_CLIENT_ID;
  const clientSecret = process.env.COGNITO_CLIENT_SECRET;
  let secret;

  let username;
  if (
    !process.env.COGNITO_CLIENT_ID ||
    !process.env.TEST_USERNAME ||
    !process.env.TEST_PASSWORD ||
    !process.env.COGNITO_CLIENT_SECRET ||
    !process.env.TEST_USERNAME_ADMIN ||
    !process.env.TEST_USERNAME_SHELTER
  ) {
    throw new Error(
      "Missing required values for generating token. Please set COGNITO_CLIENT_ID, TEST_USERNAME, TEST_PASSWORD, COGNITO_CLIENT_SECRET, TEST_USERNAME_ADMIN, and TEST_USERNAME_SHELTER in your environment variables."
    );
  }

  if (userType === "adopter") {
    username = process.env.TEST_USERNAME;
    if (!username) {
      throw new Error("TEST_USERNAME is not set. Please set it in your environment variables.");
    }
    console.log("Generating token for adopter:", username);
  } else if (userType === "admin") {
    username = process.env.TEST_USERNAME_ADMIN;
    if (!username) {
      throw new Error("TEST_USERNAME_ADMIN is not set. Please set it in your environment variables.");
    }
    console.log("Generating token for admin:", username);
  } else if (userType === "shelter") {
    username = process.env.TEST_USERNAME_SHELTER;
    if (!username) {
      throw new Error("TEST_USERNAME_SHELTER is not set. Please set it in your environment variables.");
    }
    console.log("Generating token for shelter:", username);
  } else {
    throw new Error("Invalid userType. Use 'adopter' or 'admin' or 'shelter'.");
  }

  console.log("Generating token for user:", username);

  secret = generateSecretHash(username, clientId, clientSecret);

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: process.env.TEST_PASSWORD,
      SECRET_HASH: secret
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

const createCognitoTestUserForDeletionTest = async (email) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
    MessageAction: "SUPPRESS",
    UserAttributes: [
      { Name: "email", Value: email },
    ]
  };
  try {
    await cognito.send(new AdminCreateUserCommand({
      ...params,
      Username: "nicolastack16+testdelete@gmail.com",
      TemporaryPassword: process.env.TEST_PASSWORD
    }));

    await addUserToGroupInCognito(email, "adopter");
    console.log("Cognito test user created successfully.");
  } catch (error) {
    console.error("Error creating Cognito test user:", error);
    throw new Error("Failed to create Cognito test user");
  }
};

const removeCognitoTestUser = async (email) => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email
  };

  try {
    await cognito.send(new AdminDeleteUserCommand(params));
    console.log("Cognito test user removed successfully.");
    // add validation later to verify user was deleted
  } catch (error) {
    console.error("Error removing Cognito test user:", error);
    console.log("Error: ", error);
    throw new Error("Failed to remove Cognito test user");
  }
};

async function getCognitoUserByEmail(email) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Filter: `email = "${email}"`
  };
  const command = new ListUsersCommand(params);
  const result = await cognito.send(command);
  return result.Users && result.Users.length > 0 ? result.Users[0] : undefined;
}


const resetCognitoTestUser = async () => {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: "nicolastack16+updated@gmail.com",
    UserAttributes: [
      { Name: "name", Value: "jane" },
      { Name: "email", Value:"nicolastack16+test@gmail.com"}
    ],
  };
  return cognito.send(new AdminUpdateUserAttributesCommand(params));
};

module.exports = { generateBearerTokenForIntegrationTests, seedTestData, teardownTestData, createTableIfNotExists,removeCognitoTestUser, resetCognitoTestUser, createCognitoTestUserForDeletionTest,getCognitoUserByEmail };