const express = require("express");
const checkAuth = require("../middleware/check-auth");

const AccountsController = require("../controllers/accounts.controller");

const router = express.Router();

router.get("/", checkAuth, AccountsController.getAccounts);
router.post("/create", checkAuth, AccountsController.createAccount);
router.post("/update", checkAuth, AccountsController.updateAccount);
router.post("/delete", checkAuth, AccountsController.deleteAccount);

module.exports = router;
