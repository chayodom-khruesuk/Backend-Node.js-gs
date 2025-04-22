const express = require("express");
const router = express.Router();
const User = require("../model/model_user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    let username, password;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Basic ")) {
      const base64Credentials = authHeader.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "utf8"
      );
      [username, password] = credentials.split(":");
    } else {
      username = req.body.username;
      password = req.body.password;
    }

    if (!username || !password) {
      return res.status(401).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        token: token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
});

router.post("/logout", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
