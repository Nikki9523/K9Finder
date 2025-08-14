const express = require('express');
const dogController = require('../controllers/dogController');

const router = express.Router();
const { authenticateJWT } = require('../auth');

router.use(authenticateJWT);

router.post("/", dogController.createDog);

router.get("/", dogController.getDogs);

router.get("/:id", dogController.getDogById);

router.put("/:id", dogController.updateDog);

router.delete("/:id", dogController.deleteDog);

module.exports = router;
