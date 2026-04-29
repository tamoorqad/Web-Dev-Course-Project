//  this handles signup, login and  logout and user lookup
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const bcrypt  = require("bcrypt");

// signup basically hashes password and inserts new user
router.post("/signup", async (req, res) => {
  const { name, phone, email, password, role } = req.body;
  if (!name || !phone || !email || !password || !role)
    return res.json({ success: false, error: "All fields are required." });
  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.json({ success: false, error: "Email already registered." });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, phone, email, hash, role]
    );
    return res.json({ success: true, userId: result.insertId });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// login will check password and saves user to session
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.json({ success: false, error: "Email and password are required." });
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.json({ success: false, error: "Invalid email or password." });
    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, error: "Invalid email or password." });
    req.session.user = { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
    return res.json({ success: true, user: req.session.user });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// logout wil destroy the session
router.post("/logout", (req, res) => {
  req.session.destroy();
  return res.json({ success: true });
});

// get current logged in user from session
router.get("/me", (req, res) => {
  if (!req.session.user)
    return res.json({ success: false, error: "Not logged in." });
  return res.json({ success: true, user: req.session.user });
});

// get any user by id is used for owner contact info
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, phone, email, role FROM users WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.json({ success: false, error: "User not found." });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;