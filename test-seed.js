const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey"
  }
});

(async () => {
  try {
    await client.send(new PutItemCommand({
      TableName: "k9finder",
      Item: {
        id: { S: "999" },
        name: { S: "testUser" }
      }
    }));
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  }
})();