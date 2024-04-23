const getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        title: "First Post",
        content: "This is my first post",
      },
    ],
  });
};

const createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  // Create post in db
  res.status(201).json({
    message: "Post Created",
    post: {
      id: new Date().toISOString(),
      title: title,
      content: content,
    },
  });
};

module.exports = { getPosts, createPost };
