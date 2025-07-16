const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand , AdminUpdateUserAttributesCommand, AdminDeleteUserCommand, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });

async function createCognitoUser({ name, email, password, userType }) {
  console.log("Creating Cognito user:", name, email, userType);
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    MessageAction: "SUPPRESS",
    Username: email,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name }
    ],
    TemporaryPassword: password,
  };
  return cognito.send(new AdminCreateUserCommand(params));
}

async function addUserToGroupInCognito(email, groupName) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
    GroupName: groupName,
  };
  return cognito.send(new AdminAddUserToGroupCommand(params));
}

async function updateCognitoUser(email, name, newEmail) {
  console.log("Updating Cognito user:", email, name, newEmail);
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: "name", Value: name },
      ...(newEmail ? [{ Name: "email", Value: newEmail }] : []),
    ],
  };
  return cognito.send(new AdminUpdateUserAttributesCommand(params));
}

async function deleteCognitoUser(username) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
  };
  try {
    await cognito.send(new AdminDeleteUserCommand(params));
    console.log("Cognito user deleted successfully:", username);
  } catch (error) {
    console.error("Error deleting Cognito user:", error);
    throw new Error("Failed to delete Cognito user");
  }
}

async function getCognitoUserByEmail(email) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Filter: `email = "${email}"`
  };
  const command = new ListUsersCommand(params);
  const result = await cognito.send(command);
  return result.Users && result.Users.length > 0 ? result.Users[0] : undefined;
}

module.exports = { createCognitoUser, addUserToGroupInCognito,updateCognitoUser, deleteCognitoUser, getCognitoUserByEmail };