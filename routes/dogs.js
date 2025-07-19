const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../auth');
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { getDogs } = require("../dynamo.js");

router.use(authenticateJWT);

router.get("/", async (req, res) => {
  try {
    const dogs = await getDogs();
    console.log("Retrieved dogs:", dogs);
    const formattedDogs = dogs.map((item) => {
      const dog = unmarshall(item);
      // aws sdkv3 coverts SS to string sets not arrays
      //JSON doesn't support sets so convert them to arrays
      dog.likes = Array.from(dog.likes);
      dog.dislikes = Array.from(dog.dislikes);
      return dog;
    });
    console.log("Formatted dogs:", formattedDogs);
    res.status(200).json(formattedDogs);
  } catch (error) {
    console.error("Error retrieving dogs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
