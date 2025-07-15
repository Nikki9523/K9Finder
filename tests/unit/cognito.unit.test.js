jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const sendMock = jest.fn()
    .mockResolvedValueOnce({ User: { Username: 'test@test.com', email: "nicolastack16@gmail.com" } })
    .mockResolvedValueOnce({
      User: {
        Username: "test@test.com",
        Attributes: [
          { Name: "name", Value: "Nikki Updated" },
          { Name: "email", Value: "testupdated@test.com" },
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
    expect(result.User.Username).toBe("test@test.com");
    expect(result.User.email).toBe("nicolastack16@gmail.com");
  });

  it("Success: Can update an existing Cognito user", async () => {
    const result = await updateCognitoUser(
      "test@test.com",
      "Nikki Updated",
      "testupdated@test.com"
    );
    expect(result).toBeDefined();
    expect(result.User.Username).toBe("test@test.com");
    expect(result.User.Attributes).toContainEqual({
      Name: "name",
      Value: "Nikki Updated",
    });
    expect(result.User.Attributes).toContainEqual({
      Name: "email",
      Value: "testupdated@test.com",
    });
  });
});