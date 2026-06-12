// test-db.js
const mongoose = require("mongoose");

mongoose
  .connect(
    "mongodb+srv://prathmesh:prathmesh@cluster0.af558tn.mongodb.net/insightgrade",
  )
  .then(() => {
    console.log("CONNECTED");
    process.exit();
  })
  .catch((err) => {
    console.log(err);
  });
