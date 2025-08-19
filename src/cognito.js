const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand , InitiateAuthCommand, AdminUpdateUserAttributesCommand, AdminDeleteUserCommand, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });
const crypto = require("crypto");

async function createCognitoUser({ name, email, password }) {
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
  try {
    return cognito.send(new AdminCreateUserCommand(params));
  } catch (error) {
    console.error("Error creating Cognito user:", error);
    throw new Error("Failed to create Cognito user");
  }
}

async function addUserToGroupInCognito(email, groupName) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
    GroupName: groupName,
  };
  try {
    return cognito.send(new AdminAddUserToGroupCommand(params));
  } catch (error) {
    console.error("Error adding user to group in Cognito:", error);
    throw new Error("Failed to add user to group in Cognito");
  }
}

async function updateCognitoUser(email, name, newEmail) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: "name", Value: name },
      ...(newEmail ? [{ Name: "email", Value: newEmail }] : []),
    ],
  };
  try {
    return cognito.send(new AdminUpdateUserAttributesCommand(params));
  } catch (error) {
    console.error("Error updating Cognito user:", error);
    throw new Error("Failed to update Cognito user");
  }
}

async function deleteCognitoUser(username) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Username: username,
  };
  try {
    await cognito.send(new AdminDeleteUserCommand(params));
  } catch (error) {
    console.error("Error deleting Cognito user:", error);
    throw new Error("Failed to delete Cognito user");
  }
}

async function getCognitoUserByEmail(email) {
  const params = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    Filter: `email = "${email}"`,
  };
  try {
    const command = new ListUsersCommand(params);
    const result = await cognito.send(command);
    if (!result || !result.Users || result.Users.length === 0) return undefined;
    console.log("Cognito user found:", result.Users[0]);
    return result.Users[0];
  } catch (err) {
    console.error("Error getting Cognito user by email:", err);
    throw new Error("Failed to get Cognito user by email");
  }
}

async function generateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}


async function generateToken(user, password) {
  const secret = await generateSecretHash(
    user.Username,
    process.env.COGNITO_CLIENT_ID,
    process.env.COGNITO_CLIENT_SECRET
  );

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: user.Username,
      PASSWORD: password,
      SECRET_HASH: secret,
    },
  };
  try {
    const command = new InitiateAuthCommand(params);
    const data = await cognito.send(command);
    return data.AuthenticationResult.IdToken;
  } catch (err) {
    console.error("Error initiating auth:", err);
    throw new Error("token generation failed");
  }
}

async function validateCognitoUserAndPassword(email, password) {
  const user = await getCognitoUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  } else {
    try {
      return await generateToken(user, password);
    } catch (error) {
      console.error("Error with validation:", error);
      throw new Error("Invalid email or password");
    }
  }
}

module.exports = { createCognitoUser, addUserToGroupInCognito, updateCognitoUser, deleteCognitoUser, getCognitoUserByEmail, generateToken, validateCognitoUserAndPassword, generateSecretHash };