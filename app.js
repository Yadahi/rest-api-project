const express = require("express");

const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const credentials = require("./config/credentials");
const MONGODB_URI = `${credentials.MONGO_SCHEME}://${credentials.MONGO_USER}:${credentials.MONGO_PASSWORD}@${credentials.MONGO_HOSTNAME}/${credentials.MONGO_DEFAULT_DATABASE}`;
const path = require("path");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");
const auth = require("./middleware/auth");
const { clearImage } = require("./util/file");

// GraphQL
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");

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

  /** This conditional statement checks if the incoming request method is OPTIONS.
   * OPTIONS is an HTTP method used to check what methods are supported by the server.
   * If the request method is OPTIONS, it immediately sends a response with status code 200 (OK).
   * This is typically done to handle preflight requests in CORS, where the browser
   * sends an OPTIONS request to check the CORS policy before making the actual request. */
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated!");
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided" });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res
    .status(201)
    .json({ message: "File stored.", filePath: req.file.path });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    /**
     * The originalError property holds the original error object that you've thrown somewhere in your
     * application within your GraphQL resolver functions or other related logic. This allows you to
     * handle and customize errors in a more granular way, providing richer error messages or additional data if needed.
     */
    customFormatErrorFn: (error) => {
      if (!error.originalError) {
        return error;
      }
      const data = error.originalError.data;
      const message = error.message || "An error occurred.";
      const code = error.originalError.code || 500;
      return { message: message, status: code, data: data };
    },
  })
);

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
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
