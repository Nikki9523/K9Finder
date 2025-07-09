// https://expressjs.com/en/starter/hello-world.html

//To Do: Error Handling, split into separate express files under routes folder, Authorization, Testing, DynamoDB 

//https://www.youtube.com/watch?v=xUFnPGVs7so

const express = require('express');
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const app = express();
const { v4: uuidv4 } = require("uuid");
const { getUsers, createUser, updateUser } = require("./dynamo.js");
// const port = 3000;

// parse requests 
app.use(express.json());

app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

// if (process.env.NODE_ENV !== 'test') {
//   app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
//   });
// }

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
    console.log("Creating new user...");
    const newUser = { id: uuidv4(), name: req.body.name};
    console.log("New user data:", newUser);
    await createUser(newUser);
    res.status(201).json( { id: newUser.id, name: newUser.name});
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = { id: req.params.id, name: req.body.name };
    console.log("Updating user with ID:", updatedUser.id, "with name:", updatedUser.name);
    await updateUser(updatedUser.id, { name: updatedUser.name });

    res.status(200).json({ id: updatedUser.id, name: updatedUser.name });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});

// app.delete("/users/:id", (req, res) => {
//   const userId = req.params.id;
//   const userIndex = users.findIndex(user => user.id === userId);
//   users.splice(userIndex,1);
//   res.json({ message: "User deleted successfully" });
// });

module.exports = app;