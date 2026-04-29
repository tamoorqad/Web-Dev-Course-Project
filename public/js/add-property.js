// add-property.js - checks auth then handles adding a new property

document.addEventListener("DOMContentLoaded", function () {
  updateNavForSession();

  var user = getCurrentUser();
  if (!user) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }
  if (user.role !== "owner") {
    alert("Only owners can add properties.");
    window.location.href = "properties.html";
  }
});

async function handleAddProperty() {
  var user         = getCurrentUser();
  var address      = document.getElementById("address").value.trim();
  var neighborhood = document.getElementById("neighborhood").value.trim();
  var sqft         = document.getElementById("sqft").value;
  var parking      = document.getElementById("parking").checked;
  var transit      = document.getElementById("transit").checked;

  if (!address)          return showMessage("message", "Please enter the street address.", true);
  if (!neighborhood)     return showMessage("message", "Please enter the neighborhood.", true);
  if (!sqft || sqft < 1) return showMessage("message", "Please enter a valid square footage.", true);

  var result = await addProperty({
    ownerId:      user.id,
    address:      address,
    neighborhood: neighborhood,
    sqft:         parseInt(sqft),
    parking:      parking,
    transit:      transit
  });

  if (!result.success) {
    showMessage("message", result.error, true);
  } else {
    showMessage("message", "Property added! You can now add workspaces to it.", false);
    document.getElementById("address").value      = "";
    document.getElementById("neighborhood").value = "";
    document.getElementById("sqft").value         = "";
    document.getElementById("parking").checked    = false;
    document.getElementById("transit").checked    = false;
  }
}