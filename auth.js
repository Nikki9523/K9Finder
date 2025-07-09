// https://us-east-1.console.aws.amazon.com/cognito/v2/idp/set-up-your-application?region=us-east-1

// https://www.youtube.com/watch?v=8YqCKqnqpDs

// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html

require('dotenv').config();
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_DEFAULT_REGION });


const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err || !key) {
      console.error("missing signing key in jwt:", header.kid, err);
      return callback(new Error("Signing key not found"));
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      issuer: `https://cognito-idp.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`
    },
    (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(401).json({ message: "Invalid token" });
      }
      req.user = decoded;
      next();
    }
  );
};

async function generateBearerTokenForIntegrationTests() {
  if (
    !process.env.COGNITO_CLIENT_ID ||
    !process.env.TEST_USERNAME ||
    !process.env.TEST_PASSWORD ||
    !process.env.SECRET_HASH
  ) {
    throw new Error(
      "Missing required values for generating token. Please set COGNITO_CLIENT_ID, TEST_USERNAME, TEST_PASSWORD, and SECRET_HASH in your environment variables."
    );
  }
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: process.env.TEST_USERNAME,
      PASSWORD: process.env.TEST_PASSWORD,
      SECRET_HASH: process.env.SECRET_HASH,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const data = await cognito.send(command);
    return data.AuthenticationResult.IdToken;
  } catch (err) {
    console.error("Error initiating auth:", err);
    throw err;
  }
}

module.exports = {authenticateJWT, generateBearerTokenForIntegrationTests};