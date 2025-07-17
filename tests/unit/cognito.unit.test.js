const {
  createCognitoUser,
  updateCognitoUser,
  deleteCognitoUser,
  addUserToGroupInCognito,
  getCognitoUserByEmail
} = require("../../cognito");

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand, // <-- add this line
} = require("@aws-sdk/client-cognito-identity-provider");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  function CognitoIdentityProviderClient() {
    this.send = sendMock;
  }
  CognitoIdentityProviderClient.sendMock = sendMock;
  // Mock AdminAddUserToGroupCommand as a constructor that stores input
  function AdminAddUserToGroupCommand(input) {
    this.input = input;
  }
  return {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand: jest.fn(),
    AdminUpdateUserAttributesCommand: jest.fn(),
    AdminDeleteUserCommand: jest.fn(),
    ListUsersCommand: jest.fn(),
    AdminAddUserToGroupCommand,
  };
});

describe("Cognito User Create and Update", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
  });

  it("Success: Can create a new Cognito user", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({
      User: { Username: "test@test.com", email: "nicolastack16@gmail.com" },
    });
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
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({
      User: {
        Username: "test@test.com",
        Attributes: [
          { Name: "name", Value: "Nikki Updated" },
          { Name: "email", Value: "testupdated@test.com" },
        ],
      },
    });
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

describe("addUserToGroupInCognito", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
  });

  it("should add a user to a Cognito group", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({});

    const email = "testuser@email.com";
    const groupName = "shelter";
    await expect(
      addUserToGroupInCognito(email, groupName)
    ).resolves.toBeDefined();

    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalledWith(
      expect.any(AdminAddUserToGroupCommand)
    );
    const calledWith =
      CognitoIdentityProviderClient.sendMock.mock.calls[0][0].input;
    expect(calledWith.Username).toBe(email);
    expect(calledWith.GroupName).toBe(groupName);
  });
});

describe("deleteCognitoUser", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
  });

  it("Success: deletes a Cognito user", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({});
    await expect(
      deleteCognitoUser("testuser@email.com")
    ).resolves.toBeUndefined();
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("Failure: throws error if Cognito deletion fails", async () => {
    const originalError = console.error;
    console.error = jest.fn();

    CognitoIdentityProviderClient.sendMock.mockRejectedValueOnce(
      new Error("AWS error")
    );
    await expect(deleteCognitoUser("testuser@email.com")).rejects.toThrow(
      "Failed to delete Cognito user"
    );
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();

    console.error = originalError;
  });
});

describe("getCognitoUserByEmail", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
  });

  it("returns the user if found", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({
      Users: [
        { Username: "testuser", Attributes: [{ Name: "email", Value: "test@email.com" }] }
      ]
    });
    const user = await getCognitoUserByEmail("test@email.com");
    expect(user).toEqual({
      Username: "testuser",
      Attributes: [{ Name: "email", Value: "test@email.com" }]
    });
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("returns undefined if no user is found", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({ Users: [] });
    const user = await getCognitoUserByEmail("notfound@email.com");
    expect(user).toBeUndefined();
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("returns undefined if Users is not present", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({});
    const user = await getCognitoUserByEmail("notfound@email.com");
    expect(user).toBeUndefined();
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });
});
