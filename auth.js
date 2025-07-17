// https://us-east-1.console.aws.amazon.com/cognito/v2/idp/set-up-your-application?region=us-east-1

// https://www.youtube.com/watch?v=8YqCKqnqpDs

// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html

require('dotenv').config();
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback, customClient) {
  (customClient || client).getSigningKey(header.kid, function(err, key) {
    if (err || !key) {
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

const checkPermissions = (user, requiredGroup) => {
  const groups = user["cognito:groups"] || [];
  return groups.includes(requiredGroup);
};

const checkIfUserIsRequestingOwnDetails = (userId, cognitoUserId) => {
  return userId === cognitoUserId;
};

module.exports = {authenticateJWT, getKey, checkPermissions,checkIfUserIsRequestingOwnDetails};