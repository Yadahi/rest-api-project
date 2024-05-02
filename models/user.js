const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  /** ref: "Post": This specifies the model that the ObjectId refers to. In this case, it's referencing the Post model.
   * When Mongoose sees this reference, it understands that the posts array will contain ObjectIds that correspond to documents in the Post collection. */
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
