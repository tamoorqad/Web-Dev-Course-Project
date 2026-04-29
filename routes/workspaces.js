// workspaces.js handles all CRUD for workspaces
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// gets all workspaces, optionally filtered by propertyId
router.get("/", async (req, res) => {
  try {
    const propertyId = req.query.propertyId;
    const [rows] = propertyId
      ? await db.query("SELECT * FROM workspaces WHERE property_id = ?", [propertyId])
      : await db.query("SELECT * FROM workspaces");
    return res.json({ success: true, workspaces: rows });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// gets a single workspace by id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM workspaces WHERE id = ?", [req.params.id]);
    if (rows.length === 0)
      return res.json({ success: false, error: "Workspace not found." });
    return res.json({ success: true, workspace: rows[0] });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// adds a new workspace under a property
router.post("/", async (req, res) => {
  const { propertyId, type, seats, price, leaseTerm, availabilityDate, smoking } = req.body;
  if (!propertyId || !type || !seats || !price || !leaseTerm || !availabilityDate)
    return res.json({ success: false, error: "Missing required fields." });
  try {
    const [result] = await db.query(
      "INSERT INTO workspaces (property_id, type, seats, price, lease_term, availability_date, smoking) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [propertyId, type, seats, price, leaseTerm, availabilityDate, smoking ? 1 : 0]
    );
    return res.json({ success: true, workspaceId: result.insertId });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// updates a workspace by id
router.put("/:id", async (req, res) => {
  const { type, seats, price, leaseTerm, availabilityDate, smoking } = req.body;
  if (!type || !seats || !price || !leaseTerm || !availabilityDate)
    return res.json({ success: false, error: "Missing required fields." });
  try {
    const [result] = await db.query(
      "UPDATE workspaces SET type=?, seats=?, price=?, lease_term=?, availability_date=?, smoking=? WHERE id=?",
      [type, seats, price, leaseTerm, availabilityDate, smoking ? 1 : 0, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.json({ success: false, error: "Workspace not found." });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// deletes a workspace by id
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM workspaces WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0)
      return res.json({ success: false, error: "Workspace not found." });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;