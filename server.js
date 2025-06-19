// https://expressjs.com/en/starter/hello-world.html

//To Do: Error Handling, split into separate express files under routes folder, Authorization, Testing, DynamoDB 

//https://www.youtube.com/watch?v=xUFnPGVs7so

const express = require('express');
const app = express();
const { v4: uuidv4 } = require("uuid");
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

//Basic User CRUD

let users = [{id: "1234", name: 'Nicola'}, {id:"456", name: 'Michele'}];

app.post("/users", (req, res) => {
  const newUser = { id: uuidv4(), name: req.body.name};
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get("/users", (req, res) => {
  res.json(users);
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  const user = users.find(user => user.id === userId);

  if (!user) {
    return res.status(404).json({ message: "User does not exist" });
  }
  res.json(user);
});

app.put("/users/:id", (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(user => user.id === userId);
  const newName = req.body.name;
  users[userIndex].name = newName;
  res.json(users[userIndex]);

});

app.delete("/users/:id", (req, res) => {
  const userId = req.params.id;
  const userIndex = users.findIndex(user => user.id === userId);
  users.splice(userIndex,1);
  res.json({ message: "User deleted successfully" });
});

module.exports = app;