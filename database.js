const mongoose = require("mongoose");

mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

class Database {
  constructor() {
    this.connect();
  }

  connect() {
    mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log("Database connected");
      })
      .catch((err) => {
        console.log("Databse error: ", err);
      });
  }
}

module.exports = new Database();
