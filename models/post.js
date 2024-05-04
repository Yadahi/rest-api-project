const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

/**
 * postSchema is used to create a Mongoose model named "Post" using mongoose.model("Post", postSchema).
 * This model will allow you to interact with the "Post" collection in your MongoDB database using Mongoose methods.
 */
module.exports = mongoose.model("Post", postSchema);
