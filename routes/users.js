var express = require("express");
var bcrypt = require("bcrypt");
var router = express.Router();
const user = require("../model/model_user");
const tokenMiddleware = require("../middleware/token_middleware");

router.get("/", tokenMiddleware, async function (req, res, next) {
  try {
    if (req.user.role != "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await user.find();
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:identifier", tokenMiddleware, async function (req, res, next) {
  try {
    const identifier = req.params.identifier;
    let users;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      users = await user.findById(identifier);

      if (!users) {
        return res.status(404).json({ message: "User not found" });
      }

      if (
        req.user.role === "admin" ||
        req.user.user_id === users.user_id ||
        req.user.username === users.username
      ) {
        return res.status(200).json(users);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      users = await user.find({
        $or: [{ username: identifier }, { user_id: identifier }],
      });

      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.user.role !== "admin") {
        users = users.filter(
          (u) =>
            u.user_id === req.user.user_id || u.username === req.user.username
        );

        if (users.length === 0) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      return res.status(200).json(users);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/register", async function (req, res, next) {
  try {
    const { username, password, email, phone, role, age, gender } = req.body;

    if (!username || !password || !email || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await user.find({
      $or: [{ username }, { email }, { phone }],
    });

    if (existingUser.length > 0) {
      const duplicateField = [];

      if (existingUser.some((u) => u.username === username)) {
        duplicateField.push("username");
      }
      if (existingUser.some((u) => u.email === email)) {
        duplicateField.push("email");
      }
      if (existingUser.some((u) => u.phone === phone)) {
        duplicateField.push("phone");
      }

      return res.status(400).json({
        message: `${duplicateField.join(", ")} already exists`,
      });
    }

    const userRole = role || "user";

    let prefix = userRole === "admin" ? "adm" : "usr";

    const latestUser = await user.findOne(
      { user_id: new RegExp(`^${prefix}`) },
      {},
      { sort: { user_id: -1 } }
    );

    let nextNumber = 1;
    if (latestUser && latestUser.user_id) {
      const currentNumber = parseInt(latestUser.user_id.replace(prefix, ""));
      nextNumber = isNaN(currentNumber) ? 1 : currentNumber + 1;
    }

    const user_id = `${prefix}${nextNumber.toString().padStart(2, "0")}`;

    let hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new user({
      user_id,
      username,
      password: hashedPassword,
      email,
      phone,
      role: userRole,
      age,
      gender,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    const { password, email, phone } = req.body;
    const { id } = req.params;

    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUser = await user.findByIdAndUpdate(
      id,
      { password: hashedPassword, email, phone },
      { new: true }
    );
    res.status(200).json(updateUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:identifier", tokenMiddleware, async function (req, res, next) {
  try {
    const identifier = req.params.identifier;
    let deleteUser;

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    if (isValidObjectId) {
      deleteUser = await user.findByIdAndDelete(identifier);
    } else {
      const userToDelete = await user.findOne({ user_id: identifier });
      if (userToDelete) {
        deleteUser = await user.findByIdAndDelete(userToDelete._id);
      }
    }

    if (!deleteUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(deleteUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
