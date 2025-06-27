const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

require('dotenv').config();

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_DEFAULT_REGION });


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

module.exports = { getUsers };