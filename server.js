// this is the main Express server
const express  = require("express");
const session  = require("express-session");
const cors     = require("cors");
const path     = require("path");

const usersRouter      = require("./routes/users");
const propertiesRouter = require("./routes/properties");
const workspacesRouter = require("./routes/workspaces");

const app  = express();
const PORT = 3000;

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret:            "workspace_secret_key",
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// API routes first before static files
app.use("/api/users",      usersRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/workspaces", workspacesRouter);

// serve frontend files after API routes
app.use(express.static(path.join(__dirname, "public")));

app.get("/{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
});