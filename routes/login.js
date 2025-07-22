const express = require("express");
const router = express.Router();
const { validateCognitoUserAndPassword } = require("../cognito.js");

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide both email and password for authentication",
    });
  }
  try {
    const token = await validateCognitoUserAndPassword(email, password);
    return res.status(200).json({ message: "Login was successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    if (error.message === "Invalid email or password") {
      return res.status(401).json({ message: "Invalid email or password" });
    } else {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
});

module.exports = router;
