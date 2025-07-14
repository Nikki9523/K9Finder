const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminUpdateUserAttributesCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });

async function createCognitoUser({ name, email, password }) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    MessageAction: "SUPPRESS",
    Username: email,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
    ],
    TemporaryPassword: password,
  };
  return cognito.send(new AdminCreateUserCommand(params));
}

async function updateCognitoUser(username, name, newEmail) {
  console.log("Updating Cognito user:", username, name, newEmail);
  if (!username || !name) {
    throw new Error("username and name are required");
  }
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
    UserAttributes: [
      { Name: "name", Value: name },
      ...(newEmail ? [{ Name: "email", Value: newEmail }] : []),
    ],
  };
  return cognito.send(new AdminUpdateUserAttributesCommand(params));
}

module.exports = { createCognitoUser, updateCognitoUser };