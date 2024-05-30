const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");

const User = require("../models/user");
const AuthController = require("../controllers/authController");
const StatusController = require("../controllers/statusController");
const Post = require("../models/post");
const FeedController = require("../controllers/feedController");
const credentials = require("../config/credentials");
const user = require("../models/user");

describe("Feed controller", function () {
  before(function (done) {
    mongoose
      .connect(
        `${credentials.MONGO_SCHEME}://${credentials.MONGO_USER}:${credentials.MONGO_PASSWORD}@${credentials.MONGO_HOSTNAME}/test-messages?retryWrites=true`
      )
      .then((result) => {
        const user = new User({
          email: "a@a.com",
          password: "12345",
          name: "test",
          posts: [],
          _id: "5c0f66b979af55031b34728a",
        });
        return user.save();
      })
      .then(() => {
        done();
      });
  });

  it("should add a created post to the posts of the creator", function (done) {
    const req = {
      body: {
        title: "Test Post",
        content: "Test Content",
      },
      file: {
        path: "abc",
      },
      userId: "5c0f66b979af55031b34728a",
    };
    const res = {
      status: function () {
        return this;
      },
      json: function () {},
    };

    FeedController.createPost(req, res, () => {}).then((savedUser) => {
      expect(savedUser).to.have.property("posts");
      expect(savedUser.posts).to.have.length(1);
      done();
    });
  });

  after(function (done) {
    User.deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      });
  });
});
