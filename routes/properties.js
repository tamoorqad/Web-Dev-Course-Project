// properties.js handles all CRUD for properties
const express = require("express");
const router  = express.Router();
const db      = require("../db");

// gets all properties or filters by ownerId if provided
router.get("/", async (req, res) => {
  try {
    const ownerId = req.query.ownerId;
    const [rows] = ownerId
      ? await db.query("SELECT * FROM properties WHERE owner_id = ?", [ownerId])
      : await db.query("SELECT * FROM properties");
    return res.json({ success: true, properties: rows });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// gets a single property by id
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0)
      return res.json({ success: false, error: "Property not found." });
    return res.json({ success: true, property: rows[0] });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// adds a new property under the logged in owner
router.post("/", async (req, res) => {
  const { ownerId, address, neighborhood, sqft, parking, transit } = req.body;
  if (!ownerId || !address || !neighborhood || !sqft)
    return res.json({ success: false, error: "Missing required fields." });
  try {
    const [result] = await db.query(
      "INSERT INTO properties (owner_id, address, neighborhood, sqft, parking, transit) VALUES (?, ?, ?, ?, ?, ?)",
      [ownerId, address, neighborhood, sqft, parking ? 1 : 0, transit ? 1 : 0]
    );
    return res.json({ success: true, propertyId: result.insertId });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// updates a property by id
router.put("/:id", async (req, res) => {
  const { address, neighborhood, sqft, parking, transit } = req.body;
  if (!address || !neighborhood || !sqft)
    return res.json({ success: false, error: "Missing required fields." });
  try {
    const [result] = await db.query(
      "UPDATE properties SET address=?, neighborhood=?, sqft=?, parking=?, transit=? WHERE id=?",
      [address, neighborhood, sqft, parking ? 1 : 0, transit ? 1 : 0, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.json({ success: false, error: "Property not found." });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

// deletes a property and cascades to its workspaces
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0)
      return res.json({ success: false, error: "Property not found." });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;