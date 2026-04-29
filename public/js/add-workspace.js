//checks auth, loads owner properties, then handles adding a workspace

document.addEventListener("DOMContentLoaded", async function () {
  updateNavForSession();

  var user = getCurrentUser();
  if (!user) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }
  if (user.role !== "owner") {
    alert("Only owners can add workspaces.");
    window.location.href = "properties.html";
    return;
  }

  await loadOwnerProperties(user.id);
  document.getElementById("availabilityDate").valueAsDate = new Date();
});

// populates the property dropdown with the owners properties
async function loadOwnerProperties(ownerId) {
  var select     = document.getElementById("propertyId");
  var properties = await getPropertiesByOwner(ownerId);

  if (properties.length === 0) {
    select.innerHTML = '<option value="">No properties yet — add one first</option>';
    return;
  }

  properties.forEach(function (p) {
    var opt         = document.createElement("option");
    opt.value       = p.id;
    opt.textContent = p.address + " (" + p.neighborhood + ")";
    select.appendChild(opt);
  });
}

async function handleAddWorkspace() {
  var propertyId       = document.getElementById("propertyId").value;
  var type             = document.getElementById("type").value;
  var seats            = document.getElementById("seats").value;
  var price            = document.getElementById("price").value;
  var leaseTerm        = document.getElementById("leaseTerm").value;
  var availabilityDate = document.getElementById("availabilityDate").value;
  var smoking          = document.getElementById("smoking").checked;

  if (!propertyId)         return showMessage("message", "Please select a property.", true);
  if (!type)               return showMessage("message", "Please select a workspace type.", true);
  if (!seats || seats < 1) return showMessage("message", "Please enter seating capacity.", true);
  if (!price || price < 0) return showMessage("message", "Please enter a valid price.", true);
  if (!leaseTerm)          return showMessage("message", "Please select a lease term.", true);
  if (!availabilityDate)   return showMessage("message", "Please select an availability date.", true);

  var result = await addWorkspace({
    propertyId:       propertyId,
    type:             type,
    seats:            parseInt(seats),
    price:            parseFloat(price),
    leaseTerm:        leaseTerm,
    availabilityDate: availabilityDate,
    smoking:          smoking
  });

  if (!result.success) {
    showMessage("message", result.error, true);
  } else {
    showMessage("message", "Workspace added successfully!", false);
    document.getElementById("type").value      = "";
    document.getElementById("seats").value     = "";
    document.getElementById("price").value     = "";
    document.getElementById("leaseTerm").value = "";
    document.getElementById("availabilityDate").valueAsDate = new Date();
    document.getElementById("smoking").checked = false;
  }
}