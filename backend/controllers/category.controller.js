const Category = require("../models/category.model");

exports.getCategories = (req, res, next) => {

  const query = Category.find();

  query
    .then(fetched => {
      res.status(200).json({
        message: "Categories fetched successfully!",
        categories: fetched
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.createCategory = (req, res, next) => {

  const category = new Category({
    category: req.body.category,
  });

  category
    .save()
    .then(createdData => {
      res.status(201).json({
        message: "Category added successfully",
        category: {
          ...createdData,
          id: createdData._id
        }
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.updateCategory = (req, res, next) => {

  const category = new Category({
    _id: req.body.id,
    category: req.body.category,
  });

  Category.updateOne({ _id: category._id }, category)
    .then(result => {
      if (result.n > 0) {
        res.status(200).json({ message: "Update successful!" });
      } else {
        res.status(401).json({ message: "Update failed!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
};

exports.deleteCategory = (req, res, next) => {

  Category.deleteOne({ _id: req.body.id })
    .then(result => {

      if (result.deletedCount > 0) {
        res.status(200).json({ message: "Deletion successful!" });
      } else {
        res.status(401).json({ message: "Deletion failed!" });
      }
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });
};
