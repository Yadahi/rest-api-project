const express = require("express");
const feeRoutes = require("./routes/feed");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

app.use("/feed", feeRoutes);

app.listen(8080, () => console.log("Server running on port 8080"));
