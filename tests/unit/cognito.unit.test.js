jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const sendMock = jest.fn()
    .mockResolvedValueOnce({ User: { Username: '12345678', email: "nicolastack16@gmail.com" } })
    .mockResolvedValueOnce({
      User: {
        Username: "12345678",
        Attributes: [
          { Name: "name", Value: "Nikki Updated" },
          { Name: "email", Value: "test@test.com" },
        ],
      },
    });

  return {
    CognitoIdentityProviderClient: jest.fn(() => ({
      send: sendMock
    })),
    AdminCreateUserCommand: jest.fn(),
    AdminUpdateUserAttributesCommand: jest.fn()
  };
});

const { createCognitoUser, updateCognitoUser } = require('../../cognito');

describe("Cognito User Management", () => {
  it("Success: Can create a new Cognito user", async () => {
    const newUser = {
      name: "Nikki",
      email: "nicolastack16@gmail.com",
      password: process.env.TEST_PASSWORD,
    };
    const result = await createCognitoUser(newUser);
    expect(result.User.Username).toBe("12345678");
    expect(result.User.email).toBe("nicolastack16@gmail.com");
  });

  it("Success: Can update an existing Cognito user", async () => {
    const result = await updateCognitoUser(
      "12345678",
      "Nikki Updated",
      "test@test.com"
    );
    expect(result).toBeDefined();
    expect(result.User.Username).toBe("12345678");
    expect(result.User.Attributes).toContainEqual({
      Name: "name",
      Value: "Nikki Updated",
    });
    expect(result.User.Attributes).toContainEqual({
      Name: "email",
      Value: "test@test.com",
    });
  });
  
  it("Error: updateCognitoUser throws if username or name is missing", async () => {
    await expect(updateCognitoUser(undefined, "Nikki Updated"))
      .rejects.toThrow("username and name are required");
    await expect(updateCognitoUser("12345678", undefined))
      .rejects.toThrow("username and name are required");
  });
});