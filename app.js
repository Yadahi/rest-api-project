const express = require("express");
const feeRoutes = require("./routes/feed");

const app = express();

app.use("/feed", feeRoutes);

app.listen(8080, () => console.log("Server running on port 8080"));
