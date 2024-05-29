const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");

const User = require("../models/user");
const AuthController = require("../controllers/authController");
const StatusController = require("../controllers/statusController");
const credentials = require("../config/credentials");

describe("Auth controller - login", function () {
  it("should throw an error with status 500 if accessing the database fails", function (done) {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "a@a.com",
        password: "12345",
      },
    };

    AuthController.login(req, {}, () => {}).then((result) => {
      console.log(result);
      expect(result).to.be.an("error");
      expect(result).to.have.property("statusCode", 500);
      done();
    });

    User.findOne.restore();
  });

  it("should send a response with a valid user status for an existing user", function (done) {
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
        const req = {
          userId: "5c0f66b979af55031b34728a",
        };
        const res = {
          statusCode: 500,
          userStatus: null,
          status: function (code) {
            this.statusCode = code;
            return this;
          },
          json: function (data) {
            this.userStatus = data.status;
          },
        };
        StatusController.getStatus(req, res, () => {}).then(() => {
          expect(res.statusCode).to.be.equal(200);
          expect(res.userStatus).to.be.equal("I am new");
          User.deleteMany({})
            .then(() => {
              return mongoose.disconnect();
            })
            .then(() => {
              done();
            });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
