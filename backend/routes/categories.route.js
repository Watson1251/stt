const express = require("express");
const checkAuth = require("../middleware/check-auth");

const CategoriesController = require("../controllers/category.controller");

const router = express.Router();

router.get("/", checkAuth, CategoriesController.getCategories);
router.post("/create", checkAuth, CategoriesController.createCategory);
router.post("/update", checkAuth, CategoriesController.updateCategory);
router.post("/delete", checkAuth, CategoriesController.deleteCategory);

module.exports = router;
