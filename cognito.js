const { CognitoIdentityProviderClient, AdminCreateUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });

async function createCognitoUser({ name, email, password }) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    MessageAction: "SUPPRESS",
    Username: email,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name }
    ],
    TemporaryPassword: password
  };
  return cognito.send(new AdminCreateUserCommand(params));
}

module.exports = { createCognitoUser };