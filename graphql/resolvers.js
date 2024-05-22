const User = require("../models/user");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const credentials = require("../config/credentials");
const Post = require("../models/post");
const { clearImage } = require("../util/file");

module.exports = {
  /**
   * Asynchronously creates a new user based on the provided userInput.
   *
   * @param {Object} userInput - The input data for creating the user.
   * @param {Object} req - The request object.
   * @return {Object} The newly created user object.
   */
  createUser: async function ({ userInput }, req) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "E-Mail is invalid." });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      throw new Error("User exists already.");
    }
    const hashedPassword = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found.");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong password!");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      credentials.jwtSecret,
      {
        expiresIn: "1h",
      }
    );
    return {
      token: token,
      userId: user._id.toString(),
    };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated!");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is invalid." });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is invalid." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user.");
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createPost = await post.save();
    user.posts.push(createPost);
    await user.save();
    return {
      ...createPost._doc,
      _id: createPost.id.toString(),
      createdAt: createPost._doc.createdAt.toISOString(),
      updatedAt: createPost._doc.updatedAt.toISOString(),
    };
  },

  getAllPosts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated!");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");
    if (!posts) {
      const error = new Error("No posts found!");
      error.code = 404;
      throw error;
    }
    const listPosts = posts.map((post) => {
      return {
        ...post._doc,
        _id: post.id.toString(),
        createdAt: post._doc.createdAt.toISOString(),
        updatedAt: post._doc.updatedAt.toISOString(),
      };
    });
    return { posts: listPosts, totalPosts: totalPosts };
  },

  getPost: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated!");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post.id.toString(),
      createdAt: post._doc.createdAt.toISOString(),
      updatedAt: post._doc.updatedAt.toISOString(),
    };
  },

  updatePost: async function ({ postId, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated!");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not authorized!");
      error.code = 403;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is invalid." });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: "Content is invalid." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }
    const updatePost = await post.save();
    return {
      ...updatePost._doc,
      _id: updatePost.id.toString(),
      createdAt: updatePost._doc.createdAt.toISOString(),
      updatedAt: updatePost._doc.updatedAt.toISOString(),
    };
  },

  deletePost: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthenticated!");
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("No post found!");
      error.code = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("Not authorized!");
      error.code = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findOneAndDelete(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    return true;
  },
};
