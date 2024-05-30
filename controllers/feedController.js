const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

// const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");

const getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully.",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  /** This error occurs when the data provided to the function fails validation checks.
   * For example, if the title or content of the post doesn't meet certain criteria (e.g., length requirements, forbidden characters), it would result in a validation error. */
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    throw error;
  }
  /** This error occurs when the function expects an image file to be included in the request, but none is provided.
   * In the context of this function, it implies that the post being created requires an associated image, and not providing one is considered an error.*/
  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  let creator;

  // Create post in db
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);
    creator = user;
    user.posts.push(post);
    const savedUser = await user.save();
    // io.getIO().emit("posts", {
    //   action: "create",
    //   post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    // });

    res.status(201).json({
      message: "Post Created",
      post: post,
      creator: {
        _id: creator._id,
        name: creator.name,
      },
    });
    return savedUser;
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched.", post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error("No file picked");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate("creator");

    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    const result = await post.save();
    io.getIO().emit("posts", { action: "update", post: result });
    res.status(200).json({ message: "Post updated", post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);

    // check logged in user
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);

    const user = await User.findById(req.userId);

    /**The pull() method in Mongoose is used to remove a specific item from an array.
     * In the provided code, user.posts.pull(postId) removes the postId from the posts array of the user document. */
    user.posts.pull(postId);
    await user.save();
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

/**
 * Deletes the image file at the specified file path.
 *
 * @param {string} filePath - The path to the image file to be deleted.
 * @return {undefined} This function does not return a value.
 */
const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

module.exports = { getPosts, createPost, getPost, updatePost, deletePost };
