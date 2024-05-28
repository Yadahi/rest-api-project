const expect = require("chai").expect;
const sinon = require("sinon");

const User = require("../models/user");
const AuthController = require("../controllers/authController");

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
});
