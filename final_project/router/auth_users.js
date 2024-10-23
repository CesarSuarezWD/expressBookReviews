const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return typeof username === 'string' && username.trim().length >= 3;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  const user = users[username];
  return user && user.password === password;
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!authenticatedUser(username, password)) {
      return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, 'your_jwt_secret_key', { expiresIn: '1h' });
  // console.log("Token generated:", token);
  return res.status(200).json({ token });
});


// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
      return res.status(403).json({ message: "No token provided" });
  }

  // console.log("Token received:", token);

  jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
      if (err) {
          console.log("Token error verification:", err);
          return res.status(401).json({ message: "Unauthorized" });
      }

      // console.log("decoded Payload:", decoded);

      const username = decoded.username;
      const { review } = req.query;

      if (!review) {
          return res.status(400).json({ message: "Review is required" });
      }

      const isbn = req.params.isbn;

      if (!books[isbn]) {
          return res.status(404).json({ message: "Book not found" });
      }

      if (!books[isbn].reviews) {
          books[isbn].reviews = {};
      }

      books[isbn].reviews[username] = review;

      return res.status(200).json({ message: "Review added/modified successfully", reviews: books[isbn].reviews });
  });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
      return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, 'your_jwt_secret_key', (err, decoded) => {
      if (err) {
          return res.status(401).json({ message: "Unauthorized" });
      }

      const username = decoded.username;
      const isbn = req.params.isbn;

      if (!books[isbn]) {
          return res.status(404).json({ message: "Book not found" });
      }

      const reviews = books[isbn].reviews;

      if (!reviews || !reviews[username]) {
          return res.status(404).json({ message: "Review not found for this user" });
      }

      delete reviews[username];

      return res.status(200).json({ message: "Review deleted successfully", reviews: books[isbn].reviews });
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
