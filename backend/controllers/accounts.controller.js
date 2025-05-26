const Account = require("../models/account.model");

exports.getAccounts = (req, res, next) => {

  const query = Account.find();

  query
    .then(fetched => {
      res.status(200).json({
        message: "Accounts fetched successfully!",
        accounts: fetched
      });
    })
    .catch(error => {
      console.error(error.message);
      res.status(500).json({
        message: error.message
      });
    });

};

exports.createAccount = (req, res, next) => {

  const account = new Account({
    name: req.body.name,
    username: req.body.username,
  });

  account
    .save()
    .then(createdData => {
      res.status(201).json({
        message: "Account added successfully",
        account: {
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

exports.updateAccount = (req, res, next) => {

  const account = new Account({
    _id: req.body.id,
    name: req.body.name,
    username: req.body.username,
  });

  Account.updateOne({ _id: account._id }, account)
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

exports.deleteAccount = (req, res, next) => {

  Account.deleteOne({ _id: req.body.id })
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
