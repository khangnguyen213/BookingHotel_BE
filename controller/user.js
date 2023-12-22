const User = require("../model/user");

//Login
const postLogin = (req, res, next) => {
  // console.log(req.body);
  User.find({ username: req.body.username })
    .then((result) => {
      console.log(result);
      if (result.length !== 0) {
        const user = result[0];
        if (req.body.password === user.password) {
          res.send(user);
        } else {
          res.statusCode = 400;
          res.statusMessage = "Password incorrect";
          // // return res.end();
          res.end();
        }
      } else {
        res.statusCode = 400;
        res.statusMessage = "Username incorrect";
        // // return res.end();
        res.end();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

//Register
const postRegister = (req, res, next) => {
  console.log(req.body);
  User.find({ username: req.body.username })
    .then((result) => {
      console.log(result);
      if (!result || result.length === 0) {
        const user = new User(req.body);
        user.save().then((user) => {
          res.send(user);
          // return res.end();
        });
      } else {
        res.statusCode = 400;
        res.statusMessage = "Username existed";
        // // return res.end();
        res.end();
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

//get user list
const getUser = (req, res, next) => {
  User.find()
    .then((arr) => res.send(arr))
    .catch((err) => console.log(err));
};

const authenticateUser = (req, res, next) => {
  User.findById(req.body.userId)
    .then((user) => {
      if (user) {
        req.user = user;
        next();
      } else {
        throw new Error("Don't have permission");
      }
    })
    .catch((err) => res.send(err.toString()));
};

exports.postLogin = postLogin;
exports.postRegister = postRegister;
exports.getUser = getUser;
exports.authenticateUser = authenticateUser;
