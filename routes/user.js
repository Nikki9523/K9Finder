const express = require('express');
const router = express.Router();
const { authenticateJWT} = require('../auth');
const userController = require('../controllers/userController');

router.use(authenticateJWT);

router.get("/", userController.getAllUsers);

router.get("/shelters", userController.getShelterUsers);

router.get("/adopters", userController.getAdopterUsers);

router.get("/:id", userController.getUserById);

router.post('/', userController.createUser);

router.put("/:id", userController.updateUser);

router.delete("/:id", userController.deleteUser);

module.exports = router;
