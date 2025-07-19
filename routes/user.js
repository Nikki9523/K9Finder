const express = require('express');
const router = express.Router();
const { authenticateJWT, checkPermissions, checkIfUserIsRequestingOwnDetails } = require('../auth');
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { getUsers, createUser, updateUser, deleteUser } = require("../dynamo.js");
const { createCognitoUser, addUserToGroupInCognito, updateCognitoUser, deleteCognitoUser, getCognitoUserByEmail} = require('../cognito');

router.use(authenticateJWT);

/*added cognito functionality to create, update and delete users as cognito should match dynamoDB
  didn't add functionality to get all or get by id as I don't think this is needed as it should
  be the same info as dynamoDB
  */


// refactor these users functions to be more DRY
router.get("/", async (req, res) => {
  if (!checkPermissions(req.user, "admin")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const users = await getUsers();
    res.status(200).json(users.map((user) => unmarshall(user)));
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/shelters", async (req, res) => {
  if (!checkPermissions(req.user, "admin") && !checkPermissions(req.user, "adopter")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const users = await getUsers();
    const shelters = users.map(unmarshall).filter(u => u.userType === "shelter");
    res.status(200).json(shelters);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/adopters", async (req, res) => {
  if (!checkPermissions(req.user, "admin") && !checkPermissions(req.user, "shelter")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  try {
    const users = await getUsers();
    const adopters = users.map(unmarshall).filter(u => u.userType === "adopter");
    res.status(200).json(adopters);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  const cognitoUserId = req.user.sub;
  if (!checkPermissions(req.user, "admin") && !checkPermissions(req.user, "shelter") && !checkIfUserIsRequestingOwnDetails(userId, cognitoUserId)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const users = await getUsers();

  const usersFormatted = users.map(user => unmarshall(user));
  const user = usersFormatted.find(user => user.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User does not exist" });
  }
  res.json(user);
});

// resetrict to admin, will add self register later
router.post('/', async (req, res) => {
  try {
    if (!req.body.email || !req.body.name || !req.body.userType || !req.body.password) {
      return res.status(400).json({ error: "Missing required fields: name, email, password" });
    }
    const cognitoUser = await createCognitoUser({ name: req.body.name, email: req.body.email, password: req.body.password});
    const cognitoUserId = cognitoUser.User.Username;
    await addUserToGroupInCognito(req.body.email, req.body.userType);
    const createdUser = await createUser({ id: cognitoUserId, name: req.body.name, email: req.body.email, userType: req.body.userType });
    res.status(201).json(createdUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const users = await getUsers();
    const usersFormatted = users.map((user) => unmarshall(user));
    const existingUser = usersFormatted.find((user) => user.id === userId);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = {
      id: userId,
      name: req.body.name,
      email: req.body.email,
      newEmail: req.body.newEmail,
      userType: existingUser.userType // Don't think userType should be able to be updated but might change
    };

    //dynamoDb
    await updateUser(updatedUser.id, {
      name: updatedUser.name,
      email: updatedUser.newEmail,
    });
    //cognito
    await updateCognitoUser(
      updatedUser.email,
      updatedUser.name,
      updatedUser.newEmail
    );

    res.status(200).json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, userType: updatedUser.userType });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// restrict to admin or self
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const email = req.body.email;

    // dynamoDB
    await deleteUser(userId);

    const validateUserExists = await getCognitoUserByEmail(email);

    if (!validateUserExists) {
      return res.status(404).json({ message: "User does not exist" });
    }
    
    await deleteCognitoUser(email);
    
    res.status(200).json({ message: "User deleted successfully", id: userId });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
