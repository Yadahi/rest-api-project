const { validationResult } = require("express-validator");

const Post = require("../models/post");

const getPosts = (req, res, next) => {
  // Fetch posts from db
  Post.find()
    .then((posts) => {
      res.status(200).json({
        message: "Fetched posts successfully.",
        posts: posts,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const createPost = (req, res, next) => {
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
  // Create post in db
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: {
      name: "Max",
    },
  });
  post
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Post Created",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched.", post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

module.exports = { getPosts, createPost, getPost };
