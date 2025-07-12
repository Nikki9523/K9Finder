const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');

// Mock jwks-rsa globally for getKey tests
jest.mock('jwks-rsa', () => () => ({
  getSigningKey: (kid, cb) => cb(null, { publicKey: 'test-key' }),
}));

const { authenticateJWT, getKey } = require('../../auth');

describe("getKey", () => {
  it("Success: uses publicKey if present", (done) => {
    const header = { kid: "abc" };
    const mockClient = {
      getSigningKey: (kid, cb) => cb(null, { publicKey: "my-public-key" })
    };
    getKey(header, (err, signingKey) => {
      expect(err).toBeNull();
      expect(signingKey).toBe("my-public-key");
      done();
    }, mockClient);
  });

  it("Success: uses rsaPublicKey if publicKey is missing", (done) => {
    const header = { kid: "def" };
    const mockClient = {
      getSigningKey: (kid, cb) => cb(null, { rsaPublicKey: "my-rsa-key" })
    };
    getKey(header, (err, signingKey) => {
      expect(err).toBeNull();
      expect(signingKey).toBe("my-rsa-key");
      done();
    }, mockClient);
  });

  it("Failure: returns error if signing key is not found", (done) => {
    const header = { kid: "badkid" };
    const mockClient = {
      getSigningKey: (kid, cb) => cb(new Error("Signing key not found"), null)
    };
    getKey(header, (err, signingKey) => {
      expect(err).toBeTruthy();
      expect(err.message).toBe("Signing key not found");
      expect(signingKey).toBeUndefined();
      done();
    }, mockClient);
  });
});

describe("authenticateJWT middleware", () => {
  let errorSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("Success: calls next() if token is valid", (done) => {
    const token = jwt.sign({ sub: "123" }, "test-key", { algorithm: "HS256" });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    jest.spyOn(jwt, "verify").mockImplementation((token, getKey, opts, cb) =>
      cb(null, { sub: "123" })
    );

    authenticateJWT(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    done();
  });

  it("Failure: returns 401 if no Authorization header", (done) => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authenticateJWT(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._getData()).toMatch(/Missing or invalid Authorization header/);
    expect(errorSpy).not.toHaveBeenCalled();
    done();
  });

  it("Failure: returns 401 if token is invalid", (done) => {
    const token = jwt.sign({ sub: "123" }, "test-key", { algorithm: "HS256" });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    jest.spyOn(jwt, "verify").mockImplementation((token, getKey, opts, cb) =>
      cb(new Error("Invalid token"))
    );

    authenticateJWT(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._getData()).toMatch(/Invalid token/);
    expect(errorSpy).toHaveBeenCalledWith(
      "JWT verification error:",
      expect.any(Error)
    );
    done();
  });

  it("Failure: returns 401 if signing key is missing", (done) => {
    jest.resetModules();
    jest.doMock("jwks-rsa", () => () => ({
      getSigningKey: (kid, cb) => cb(new Error("Signing key not found")),
    }));
    // Re-require auth to get the new mock
    const { authenticateJWT } = require("../../auth");

    const token = jwt.sign({ sub: "123" }, "test-key", { algorithm: "HS256" });
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    jest.spyOn(jwt, "verify").mockImplementation((token, getKey, opts, cb) => {
      getKey({ kid: "bad" }, (err) => cb(err));
    });

    authenticateJWT(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._getData()).toMatch(/Invalid token|Signing key not found/);
    expect(errorSpy).toHaveBeenCalledWith(
      "JWT verification error:",
      expect.any(Error)
    );
    done();
  });
});

// Mock Cognito client for completeness
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const mClient = {
    send: jest.fn(),
  };
  return {
    CognitoIdentityProviderClient: jest.fn(() => mClient),
    InitiateAuthCommand: jest.fn(),
  };
});