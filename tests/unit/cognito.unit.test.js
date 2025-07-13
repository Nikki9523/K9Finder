const { createCognitoUser } = require('../../cognito');

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({ User: { Username: 'nicolastack16@gmail.com' } })
    })),
    AdminCreateUserCommand: jest.fn()
  };
});

describe("Cognito User Management", () => {
  it("Success: Can create a new Cognito user", async () => {
    const newUser = {
      name: "Nikki",
      email: "nicolastack16@gmail.com",
      password: process.env.TEST_PASSWORD
    };
    const result = await createCognitoUser(newUser);
    expect(result.User.Username).toBe("nicolastack16@gmail.com");
  });
});