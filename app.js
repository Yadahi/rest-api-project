const express = require("express");

const feeRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");
const statusRoutes = require("./routes/status");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const credentials = require("./config/credentials");
const MONGODB_URI = `mongodb+srv://${credentials.username}:${credentials.password}@cluster0.t5uhksi.mongodb.net/messages`;
const path = require("path");
const multer = require("multer");

const app = express();

/** This function initializes disk storage engine for multer. It takes an object as an argument containing configuration options.
 * destination: This property specifies the directory where uploaded files will be stored.
 * filename: This property specifies how uploaded files should be named.
 */
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

/** The fileFilter function is a middleware function used to filter uploaded files based on their MIME types.
 * It is typically used with multer, a Node.js middleware for handling multipart/form-data, which is commonly used for file uploads in web applications. */
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  /** This sets the value of the Access-Control-Allow-Origin
   * response header to *, which allows the resource to be
   * accessed by any domain. */
  res.setHeader("Access-Control-Allow-Origin", "*");

  /** This sets the value of the Access-Control-Allow-Methods
   * response header to specify the HTTP methods that are allowed
   * when accessing the resource. In this case, it allows GET, POST, PUT, PATCH, and DELETE methods.*/
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );

  /** This sets the value of the Access-Control-Allow-Headers
   * response header to specify the headers that are allowed in a
   * preflight request. In this case, it allows Content-Type and Authorization headers. */
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feeRoutes);
app.use("/auth", authRoutes);
app.use("/status", statusRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const server = app.listen(8080);
    const io = require("./socket")(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => {
    console.log(err);
  });
