const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
      minlength: 10,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    name: {
      type: String,
    },

    age: {
      type: Number,
      min: 12,
    },

    gender: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
