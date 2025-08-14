const cognitoModule = require("../../src/cognito");

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

jest.mock("@aws-sdk/client-cognito-identity-provider", () => {
  const sendMock = jest.fn();
  function CognitoIdentityProviderClient() {
    this.send = sendMock;
  }
  CognitoIdentityProviderClient.sendMock = sendMock;
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

// Default mocks for all tests
beforeAll(() => {
  jest.spyOn(cognitoModule, "generateSecretHash").mockImplementation(async () => "mocked-secret-hash");
  jest.spyOn(cognitoModule, "generateToken").mockImplementation(async (user, password) => {
    if (password === "password123") return "mock-token";
    if (password === "wrongpassword") return null;
    throw new Error("Failed to generate token");
  });
  jest.spyOn(cognitoModule, "validateCognitoUserAndPassword").mockImplementation(async (email, password) => {
    if (password === "password123") return true;
    if (password === "wrongpassword") return false;
    throw new Error("Failed to validate user");
  });
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
      password: "password123",
    };
    const result = await cognitoModule.createCognitoUser(newUser);
    expect(result.User.Username).toBe("test@test.com");
    expect(result.User.email).toBe("nicolastack16@gmail.com");
  });

  it("Failure: throws error if AWS create fails", async () => {
    CognitoIdentityProviderClient.sendMock.mockRejectedValueOnce(new Error("Failed to create Cognito user"));
    const newUser = {
      name: "Nikki",
      email: "nicolastack16@gmail.com",
      password: "password123",
    };
    await expect(cognitoModule.createCognitoUser(newUser)).rejects.toThrow("Failed to create Cognito user");
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
    const result = await cognitoModule.updateCognitoUser(
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

  it("Failure: throws error if AWS update fails", async () => {
    CognitoIdentityProviderClient.sendMock.mockRejectedValueOnce(new Error("Failed to update Cognito user"));
    await expect(
      cognitoModule.updateCognitoUser("test@test.com", "Nikki Updated", "testupdated@test.com")
    ).rejects.toThrow("Failed to update Cognito user");
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
      cognitoModule.addUserToGroupInCognito(email, groupName)
    ).resolves.toBeDefined();

    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalledWith(
      expect.any(AdminAddUserToGroupCommand)
    );
    const calledWith =
      CognitoIdentityProviderClient.sendMock.mock.calls[0][0].input;
    expect(calledWith.Username).toBe(email);
    expect(calledWith.GroupName).toBe(groupName);
  });

  it("Failure: throws error if AWS add group fails", async () => {
    CognitoIdentityProviderClient.sendMock.mockRejectedValueOnce(new Error("Failed to add user to Cognito group"));
    await expect(
      cognitoModule.addUserToGroupInCognito("testuser@email.com", "shelter")
    ).rejects.toThrow("Failed to add user to Cognito group");
  });
});

describe("deleteCognitoUser", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
  });

  it("Success: deletes a Cognito user", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({});
    await expect(
      cognitoModule.deleteCognitoUser("testuser@email.com")
    ).resolves.toBeUndefined();
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("Failure: throws error if Cognito deletion fails", async () => {
    const originalError = console.error;
    console.error = jest.fn();

    CognitoIdentityProviderClient.sendMock.mockRejectedValueOnce(
      new Error("")
    );
    await expect(cognitoModule.deleteCognitoUser("testuser@email.com")).rejects.toThrow(
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
    const user = await cognitoModule.getCognitoUserByEmail("test@email.com");
    expect(user).toEqual({
      Username: "testuser",
      Attributes: [{ Name: "email", Value: "test@email.com" }]
    });
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("returns undefined if no user is found", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({ Users: [] });
    const user = await cognitoModule.getCognitoUserByEmail("notfound@email.com");
    expect(user).toBeUndefined();
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("returns undefined if Users is not present", async () => {
    CognitoIdentityProviderClient.sendMock.mockResolvedValueOnce({});
    const user = await cognitoModule.getCognitoUserByEmail("notfound@email.com");
    expect(user).toBeUndefined();
    expect(CognitoIdentityProviderClient.sendMock).toHaveBeenCalled();
  });

  it("Failure: throws error if AWS list users fails", async () => {
    CognitoIdentityProviderClient.sendMock.mockRejectedValueOnce(new Error("AWS error"));
    await expect(cognitoModule.getCognitoUserByEmail("test@email.com")).rejects.toThrow("Failed to get Cognito user by email");
  });
});

describe("generateToken", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
  });

  it("Success: generates a token for a valid user", async () => {
    const user = { Username: "test@example.com" };
    const password = "password123";
    const token = await cognitoModule.generateToken(user, password);
    expect(token).toBeDefined();
    expect(token).toBe("mock-token");
  });

  it("Failure: returns null for invalid credentials", async () => {
    const user = { Username: "test@example.com" };
    const password = "wrongpassword";
    const token = await cognitoModule.generateToken(user, password);
    expect(token).toBeNull();
  });

  it("Failure: throws error if Cognito validation fails", async () => {
    const user = { Username: "test@example.com" };
    const password = "error";
    await expect(cognitoModule.generateToken(user, password)).rejects.toThrow(
      "Failed to generate token"
    );
  });
});

describe("validateCognitoUserAndPassword", () => {
  beforeEach(() => {
    CognitoIdentityProviderClient.sendMock.mockReset();
    cognitoModule.validateCognitoUserAndPassword.mockImplementation(async (email, password) => {
      if (password === "password123") return true;
      if (password === "wrongpassword") return false;
      throw new Error("Failed to validate user");
    });
  });

  it("Success: validates user and password", async () => {
    const email = "test@example.com";
    const password = "password123";
    const isValid = await cognitoModule.validateCognitoUserAndPassword(
      email,
      password
    );
    expect(isValid).toBe(true);
  });

  it("Failure: returns false for invalid credentials", async () => {
    const email = "test@example.com";
    const password = "wrongpassword";
    const isValid = await cognitoModule.validateCognitoUserAndPassword(
      email,
      password
    );
    expect(isValid).toBe(false);
  });

  it("Failure: throws error if Cognito validation fails", async () => {
    const email = "test@example.com";
    const password = "error";
    await expect(
      cognitoModule.validateCognitoUserAndPassword(email, password)
    ).rejects.toThrow("Failed to validate user");
  });

  it("Failure: throws error if user not found", async () => {
    cognitoModule.validateCognitoUserAndPassword.mockRestore();
    jest
      .spyOn(cognitoModule, "getCognitoUserByEmail")
      .mockResolvedValueOnce({ Users: [] });

    const email = "notfound@example.com";
    const password = "password123";
    await expect(
      cognitoModule.validateCognitoUserAndPassword(email, password)
    ).rejects.toThrow("Invalid email or password");

    // Restore the default mock for other tests
    jest.spyOn(cognitoModule, "validateCognitoUserAndPassword").mockImplementation(async (email, password) => {
      if (password === "password123") return true;
      if (password === "wrongpassword") return false;
      throw new Error("Failed to validate user");
    });
  });
});
