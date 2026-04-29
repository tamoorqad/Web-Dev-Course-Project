// browse and search workspaces, owner dashboard
document.addEventListener("DOMContentLoaded", async function () {
  updateNavForSession();
  var user = getCurrentUser();

  if (user && user.role === "owner") {
    document.getElementById("view-coworker").style.display = "none";
    document.getElementById("view-owner").style.display    = "block";
    await renderOwnerView(user);
  } else {
    await runSearch();
  }
});

var typeLabel  = { meeting: "Meeting Room", private: "Private Office", desk: "Open Desk" };
var leaseLabel = { day: "/day", week: "/week", month: "/month" };

function formatDate(d) {
  if (!d) return "N/A";
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

// filters and sorts workspaces then renders results
async function runSearch() {
  var neighborhood = document.getElementById("s-neighborhood").value.trim().toLowerCase();
  var type         = document.getElementById("s-type").value;
  var minSeats     = parseInt(document.getElementById("s-seats").value) || 0;
  var maxPrice     = parseFloat(document.getElementById("s-price").value) || Infinity;
  var lease        = document.getElementById("s-lease").value;
  var dateFilter   = document.getElementById("s-date").value;
  var needParking  = document.getElementById("s-parking").checked;
  var needTransit  = document.getElementById("s-transit").checked;
  var noSmoke      = document.getElementById("s-no-smoke").checked;
  var sortVal      = document.getElementById("sort-coworker").value;

  var workspaces = await getWorkspaces();
  var properties = await getProperties();

  var propMap = {};
  properties.forEach(function (p) { propMap[p.id] = p; });

  var results = workspaces.filter(function (ws) {
    var prop = propMap[ws.property_id];
    if (!prop) return false;
    if (neighborhood && !prop.neighborhood.toLowerCase().includes(neighborhood) && !prop.address.toLowerCase().includes(neighborhood)) return false;
    if (type     && ws.type      !== type)   return false;
    if (ws.seats < minSeats)                 return false;
    if (ws.price > maxPrice)                 return false;
    if (lease    && ws.lease_term !== lease) return false;
    if (dateFilter && ws.availability_date.slice(0,10) > dateFilter) return false;
    if (needParking && !prop.parking)        return false;
    if (needTransit && !prop.transit)        return false;
    if (noSmoke     && ws.smoking)           return false;
    return true;
  });

  if (sortVal === "price-asc")  results.sort(function (a, b) { return a.price - b.price; });
  if (sortVal === "price-desc") results.sort(function (a, b) { return b.price - a.price; });
  if (sortVal === "seats-desc") results.sort(function (a, b) { return b.seats - a.seats; });
  if (sortVal === "date-asc")   results.sort(function (a, b) { return a.availability_date.localeCompare(b.availability_date); });

  document.getElementById("results-header").textContent =
    results.length === 0 ? "No workspaces found." : results.length + " workspace(s) found";

  var container = document.getElementById("ws-results");
  if (results.length === 0) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>No workspaces match your search.</p></div>';
    return;
  }

  container.innerHTML = results.map(function (ws) {
    var prop = propMap[ws.property_id];
    return '<div class="ws-card">' +
      '<div class="ws-card-header">' +
        '<h3>' + typeLabel[ws.type] + '</h3>' +
        '<div class="address">&#128205; ' + prop.address + ', ' + prop.neighborhood + '</div>' +
      '</div>' +
      '<div class="ws-card-body">' +
        '<div class="ws-meta">' +
          '<span class="ws-meta-item">&#128101; ' + ws.seats + ' seat' + (ws.seats !== 1 ? 's' : '') + '</span>' +
          '<span class="ws-meta-item">&#128197; Avail. ' + formatDate(ws.availability_date) + '</span>' +
          (prop.parking ? '<span class="ws-meta-item">&#127359; Parking</span>' : '') +
          (prop.transit ? '<span class="ws-meta-item">&#128652; Transit</span>' : '') +
          (ws.smoking   ? '<span class="ws-meta-item">Smoking OK</span>' : '<span class="ws-meta-item">No Smoking</span>') +
        '</div>' +
        '<div class="ws-price">$' + parseFloat(ws.price).toFixed(2) + '<span>' + leaseLabel[ws.lease_term] + '</span></div>' +
      '</div>' +
      '<div class="ws-card-footer">' +
        '<button class="btn btn-secondary btn-sm" onclick="showDetail(' + ws.id + ')">View Details</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

// clears all search fields and reruns
function clearSearch() {
  ["s-neighborhood", "s-seats", "s-price", "s-date"].forEach(function (id) { document.getElementById(id).value = ""; });
  ["s-type", "s-lease"].forEach(function (id) { document.getElementById(id).value = ""; });
  ["s-parking", "s-transit", "s-no-smoke"].forEach(function (id) { document.getElementById(id).checked = false; });
  document.getElementById("sort-coworker").value = "default";
  runSearch();
}

// shows workspace detail modal with owner contact info
async function showDetail(wsId) {
  var workspaces = await getWorkspaces();
  var ws         = workspaces.find(function (w) { return w.id === wsId; });
  if (!ws) return;
  var properties = await getProperties();
  var prop       = properties.find(function (p) { return p.id === ws.property_id; });
  if (!prop) return;
  var owner      = await getUserById(prop.owner_id);

  document.getElementById("modal-ws-detail-content").innerHTML =
    '<h2>' + typeLabel[ws.type] + '</h2>' +
    '<p class="text-muted text-sm" style="margin-bottom:12px;">&#128205; ' + prop.address + ', ' + prop.neighborhood + '</p>' +
    '<div class="ws-meta" style="margin-bottom:10px;">' +
      '<span class="ws-meta-item">&#128101; ' + ws.seats + ' seats</span>' +
      '<span class="ws-meta-item">&#128197; Available ' + formatDate(ws.availability_date) + '</span>' +
      '<span class="ws-meta-item">$' + parseFloat(ws.price).toFixed(2) + leaseLabel[ws.lease_term] + '</span>' +
      (prop.parking ? '<span class="ws-meta-item">&#127359; Parking</span>' : '') +
      (prop.transit ? '<span class="ws-meta-item">&#128652; Transit</span>' : '') +
      (ws.smoking   ? '<span class="ws-meta-item">Smoking OK</span>' : '<span class="ws-meta-item">No Smoking</span>') +
    '</div>' +
    '<div class="card" style="margin-top:12px;padding:14px;">' +
      '<p class="text-muted text-sm" style="margin-bottom:6px;">Owner Contact</p>' +
      '<p><strong>' + (owner ? owner.name  : "N/A") + '</strong></p>' +
      '<p class="text-muted text-sm">' + (owner ? owner.email : "") + '</p>' +
      '<p class="text-muted text-sm">' + (owner ? owner.phone : "") + '</p>' +
    '</div>';

  openModal("modal-ws-detail");
}

// renders both tables for the owner dashboard
async function renderOwnerView(user) {
  await renderOwnerProperties(user.id);
  await renderOwnerWorkspaces(user.id);
}

// builds and renders the owner properties table
async function renderOwnerProperties(ownerId) {
  var properties = await getPropertiesByOwner(ownerId);
  var container  = document.getElementById("owner-properties");

  if (properties.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No properties yet. <a href="add-property.html">Add your first property.</a></p></div>';
    return;
  }

  var rows = properties.map(function (p) {
    return '<tr>' +
      '<td>' + p.address      + '</td>' +
      '<td>' + p.neighborhood + '</td>' +
      '<td>' + p.sqft.toLocaleString() + '</td>' +
      '<td>' + (p.parking ? "Yes" : "No") + '</td>' +
      '<td>' + (p.transit ? "Yes" : "No") + '</td>' +
      '<td>' +
        '<button class="btn btn-edit"   onclick="openEditProperty(' + p.id + ')">Edit</button> ' +
        '<button class="btn btn-danger" onclick="confirmDeleteProperty(' + p.id + ')">Delete</button>' +
      '</td>' +
    '</tr>';
  }).join("");

  container.innerHTML =
    '<div class="table-wrap"><table>' +
      '<thead><tr><th>Address</th><th>Neighborhood</th><th>Sq Ft</th><th>Parking</th><th>Transit</th><th>Actions</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table></div>';
}

// builds and renders the owner workspaces table with sort bar
async function renderOwnerWorkspaces(ownerId) {
  var properties = await getPropertiesByOwner(ownerId);
  var propIds    = new Set(properties.map(function (p) { return p.id; }));
  var propMap    = {};
  properties.forEach(function (p) { propMap[p.id] = p; });
  var allWs      = await getWorkspaces();
  var workspaces = allWs.filter(function (w) { return propIds.has(w.property_id); });
  var container  = document.getElementById("owner-workspaces");

  var sortBar = '<div class="sort-bar">' +
    '<label>Sort by:</label>' +
    '<select id="sort-owner" onchange="sortOwnerWorkspaces(' + ownerId + ')">' +
      '<option value="default">Default</option>' +
      '<option value="price-asc">Price: Low to High</option>' +
      '<option value="price-desc">Price: High to Low</option>' +
      '<option value="seats-desc">Most Seats</option>' +
      '<option value="date-asc">Availability (Soonest)</option>' +
    '</select>' +
  '</div>';

  if (workspaces.length === 0) {
    container.innerHTML = sortBar + '<div class="empty-state"><p>No workspaces yet. <a href="add-workspace.html">Add your first workspace.</a></p></div>';
    return;
  }
  container.innerHTML = sortBar + buildWorkspaceTable(workspaces, propMap);
}

// re-sorts the workspace table when the sort dropdown changes
async function sortOwnerWorkspaces(ownerId) {
  var sortVal    = document.getElementById("sort-owner").value;
  var properties = await getPropertiesByOwner(ownerId);
  var propIds    = new Set(properties.map(function (p) { return p.id; }));
  var propMap    = {};
  properties.forEach(function (p) { propMap[p.id] = p; });
  var allWs      = await getWorkspaces();
  var workspaces = allWs.filter(function (w) { return propIds.has(w.property_id); });

  if (sortVal === "price-asc")  workspaces.sort(function (a, b) { return a.price - b.price; });
  if (sortVal === "price-desc") workspaces.sort(function (a, b) { return b.price - a.price; });
  if (sortVal === "seats-desc") workspaces.sort(function (a, b) { return b.seats - a.seats; });
  if (sortVal === "date-asc")   workspaces.sort(function (a, b) { return a.availability_date.localeCompare(b.availability_date); });

  var existing    = document.getElementById("owner-workspaces").querySelector(".table-wrap");
  var replacement = document.createElement("div");
  replacement.innerHTML = buildWorkspaceTable(workspaces, propMap);
  if (existing) existing.replaceWith(replacement.firstChild);
}

// builds the workspace table html used by both render and sort functions
function buildWorkspaceTable(workspaces, propMap) {
  var rows = workspaces.map(function (ws) {
    var prop = propMap[ws.property_id];
    return '<tr>' +
      '<td>' + (prop ? prop.address : "—")         + '</td>' +
      '<td>' + typeLabel[ws.type]                   + '</td>' +
      '<td>' + ws.seats                             + '</td>' +
      '<td>$' + parseFloat(ws.price).toFixed(2)    + '</td>' +
      '<td>' + ws.lease_term                        + '</td>' +
      '<td>' + formatDate(ws.availability_date)     + '</td>' +
      '<td>' + (ws.smoking ? "Yes" : "No")          + '</td>' +
      '<td>' +
        '<button class="btn btn-edit"   onclick="openEditWorkspace(' + ws.id + ')">Edit</button> ' +
        '<button class="btn btn-danger" onclick="confirmDeleteWorkspace(' + ws.id + ')">Delete</button>' +
      '</td>' +
    '</tr>';
  }).join("");

  return '<div class="table-wrap"><table>' +
    '<thead><tr><th>Property</th><th>Type</th><th>Seats</th><th>Price</th><th>Term</th><th>Available</th><th>Smoking</th><th>Actions</th></tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
  '</table></div>';
}

// opens edit property modal and populates fields
async function openEditProperty(id) {
  var properties = await getProperties();
  var p          = properties.find(function (p) { return p.id === id; });
  if (!p) return;
  document.getElementById("edit-prop-id").value           = p.id;
  document.getElementById("edit-prop-address").value      = p.address;
  document.getElementById("edit-prop-neighborhood").value = p.neighborhood;
  document.getElementById("edit-prop-sqft").value         = p.sqft;
  document.getElementById("edit-prop-parking").checked    = p.parking;
  document.getElementById("edit-prop-transit").checked    = p.transit;
  openModal("modal-edit-property");
}

// saves property edits and re-renders owner view
async function saveEditProperty() {
  var id           = document.getElementById("edit-prop-id").value;
  var address      = document.getElementById("edit-prop-address").value.trim();
  var neighborhood = document.getElementById("edit-prop-neighborhood").value.trim();
  var sqft         = parseInt(document.getElementById("edit-prop-sqft").value);
  var parking      = document.getElementById("edit-prop-parking").checked;
  var transit      = document.getElementById("edit-prop-transit").checked;

  if (!address || !neighborhood || !sqft) return alert("Please fill in all fields.");

  var result = await updateProperty(id, { address, neighborhood, sqft, parking, transit });
  if (!result.success) return alert("Update failed: " + result.error);
  closeModal("modal-edit-property");
  await renderOwnerView(getCurrentUser());
  showMessage("message", "Property updated.", false);
}

// confirms then deletes property and cascades to workspaces
async function confirmDeleteProperty(id) {
  if (confirm("Delete this property? All its workspaces will also be deleted.")) {
    await deleteProperty(id);
    await renderOwnerView(getCurrentUser());
    showMessage("message", "Property deleted.", false);
  }
}

// opens edit workspace modal and populates fields
async function openEditWorkspace(id) {
  var workspaces = await getWorkspaces();
  var ws         = workspaces.find(function (w) { return w.id === id; });
  if (!ws) return;
  document.getElementById("edit-ws-id").value        = ws.id;
  document.getElementById("edit-ws-type").value      = ws.type;
  document.getElementById("edit-ws-seats").value     = ws.seats;
  document.getElementById("edit-ws-price").value     = ws.price;
  document.getElementById("edit-ws-lease").value     = ws.lease_term;
  document.getElementById("edit-ws-date").value      = ws.availability_date.slice(0, 10);
  document.getElementById("edit-ws-smoking").checked = ws.smoking;
  openModal("modal-edit-workspace");
}

// saves workspace edits and re-renders owner view
async function saveEditWorkspace() {
  var id           = document.getElementById("edit-ws-id").value;
  var type         = document.getElementById("edit-ws-type").value;
  var seats        = parseInt(document.getElementById("edit-ws-seats").value);
  var price        = parseFloat(document.getElementById("edit-ws-price").value);
  var leaseTerm    = document.getElementById("edit-ws-lease").value;
  var availDate    = document.getElementById("edit-ws-date").value;
  var smoking      = document.getElementById("edit-ws-smoking").checked;

  if (!type || !seats || isNaN(price) || !leaseTerm || !availDate) return alert("Please fill in all fields.");

  var result = await updateWorkspace(id, { type, seats, price, leaseTerm, availabilityDate: availDate, smoking });
  if (!result.success) return alert("Update failed: " + result.error);
  closeModal("modal-edit-workspace");
  await renderOwnerView(getCurrentUser());
  showMessage("message", "Workspace updated.", false);
}

// confirms then deletes workspace
async function confirmDeleteWorkspace(id) {
  if (confirm("Delete this workspace?")) {
    await deleteWorkspace(id);
    await renderOwnerView(getCurrentUser());
    showMessage("message", "Workspace deleted.", false);
  }
}

// modal helpers
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) overlay.classList.remove("open");
  });
});