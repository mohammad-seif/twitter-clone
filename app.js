const path = require("path");
const http = require("http");
require("dotenv").config({ path: path.join(__dirname, "config.env") });
const express = require("express");
const { requireLogin } = require("./middleware");
require("./database");
const globalErrHandler = require("./appError/globalErrHandler");
const PORT = 3003;
const session = require("express-session");

const app = express();

const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, { pingTimeout: 6000 });

app.set("view engine", "pug");
app.set("views", "views");

app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false,
  })
);

// Routes
const loginRoute = require("./routes/loginRoutes");
const registerRoute = require("./routes/registerRoutes");
const logoutRoute = require("./routes/logout");
const postRoute = require("./routes/postRoutes");
const profileRoute = require("./routes/profileRoutes");
const uploadRoute = require("./routes/uploadRoutes");
const searchRoute = require("./routes/searchRoutes");
const messagesRoutes = require("./routes/messagesRoutes");
const notificationsRoute = require("./routes/notificationRoutes");

// Api Routes
const postApiRoutes = require("./routes/api/posts");
const usersApiRoute = require("./routes/api/users");
const chatApiRoutes = require("./routes/api/chats");
const messagesApiRoute = require("./routes/api/messages");
const notificationsApiRoute = require("./routes/api/notifications");

app.use("/login", loginRoute);
app.use("/register", registerRoute);
app.use("/logout", logoutRoute);
app.use("/posts", requireLogin, postRoute);
app.use("/profile", requireLogin, profileRoute);
app.use("/uploads", uploadRoute);
app.use("/search", requireLogin, searchRoute);
app.use("/messages", requireLogin, messagesRoutes);
app.use("/notifications", requireLogin, notificationsRoute);

app.use("/api/posts", requireLogin, postApiRoutes);
app.use("/api/users", requireLogin, usersApiRoute);
app.use("/api/chats", requireLogin, chatApiRoutes);
app.use("/api/messages", requireLogin, messagesApiRoute);
app.use("/api/notifications", requireLogin, notificationsApiRoute);

app.get("/", requireLogin, (req, res) => {
  let payload = {
    pageTitle: "Billboard Community",
    userLoggedIn: req.session.user,
    userLoggedInJs: JSON.stringify(req.session.user),
  };

  res.status(200).render("home", payload);
});

app.use(globalErrHandler);

app.get("/*", (req, res) => {
  res.redirect("/");
});

server.listen(PORT, () => {
  console.log("Sever is listening on port " + PORT);
});

io.use(mid);

io.on("connection", (socket) => {
  console.log("yyyyyy");
  console.log("socket", socket);
  console.log(socket.test);
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join room", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  socket.on("notification received", (room) =>
    socket.in(room).emit("notification received")
  );

  socket.on("new message", (newMessage) => {
    let chat = newMessage.chat;
    if (!chat.users) return console.log("Chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessage.sender._id) return;
      socket.in(user._id).emit("message received", newMessage);
    });
  });
});

function mid(socket, next) {
  if (true) {
    console.log("ssss");
    socket.test = "test";
    return next();
  } else {
    console.log("no session");
    next(new Error("err"));
  }
}
