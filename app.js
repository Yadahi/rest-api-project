const express = require("express");
const feeRoutes = require("./routes/feed");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

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

app.listen(8080, () => console.log("Server running on port 8080"));
