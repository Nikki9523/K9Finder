// https://expressjs.com/en/starter/hello-world.html

//To Do: Error Handling, split into separate express files under routes folder, Authorization, Testing, DynamoDB 

//https://www.youtube.com/watch?v=xUFnPGVs7so

require('dotenv').config();
const express = require('express');
const { authenticateJWT } = require('./auth');
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const app = express();
const { v4: uuidv4 } = require("uuid");
const { getUsers, createUser, updateUser, deleteUser } = require("./dynamo.js");
const { createCognitoUser, updateCognitoUser, deleteCognitoUser, getCognitoUserByEmail} = require('./cognito');
// const port = 3000;

// parse requests 
app.use(express.json());

app.use(authenticateJWT);


// if (process.env.NODE_ENV !== 'test') {
//   app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
//   });
// }

/*added cognito functionality to create, update and delete users as cognito should match dynamoDB
  didn't add functionality to get all or get by id as I don't think this is needed as it should
  be the same info as dynamoDB
  */

app.get('/users', async (req, res) => {
  try {
    console.log("Retrieving users from DynamoDB...");
    const users = await getUsers();
    res.status(200).json(users.map(user => unmarshall(user)));
    console.log("Users retrieved successfully");
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/users/:id", async (req, res) => {

  const userId = req.params.id;

  const users = await getUsers();

  const usersFormatted = users.map(user => unmarshall(user));
  const user = usersFormatted.find(user => user.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User does not exist" });
  }
  res.json(user);
});

app.post('/users', async (req, res) => {
  try {
    if (!req.body.email || !req.body.name || !req.body.password) {
      return res.status(400).json({ error: "Missing required fields: name, email, password" });
    }
    console.log("Creating new user...");
    const createdUser = await createUser({ id: uuidv4(), name: req.body.name, email: req.body.email });
    await createCognitoUser({ name: req.body.name, email: req.body.email, password: req.body.password });
    console.log("Created user:", createdUser);
    res.status(201).json(createdUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = {
      id: req.params.id,
      name: req.body.name,
      email: req.body.email,
      newEmail: req.body.newEmail
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
    console.log("User updated successfully:", updatedUser);

    res.status(200).json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const email = req.body.email;
    console.log("Deleting user with ID:", userId, "and email:", email);

    // dynamoDB
    await deleteUser(userId);

    console.log("Deleting Cognito user with email:", email);
    const validateUserExists = await getCognitoUserByEmail(email);

    if (!validateUserExists) {
      console.log("User does not exist in cognito. Nothing to delete");
      return res.status(404).json({ message: "User does not exist" });
    }
    
    await deleteCognitoUser(email);
    
    res.status(200).json({ message: "User deleted successfully", id: userId });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = app;