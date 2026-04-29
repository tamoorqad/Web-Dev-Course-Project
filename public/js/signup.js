// this js handles role selection, validates fields, calls API then redirects

document.addEventListener("DOMContentLoaded", function () {
  updateNavForSession();
  var params = new URLSearchParams(window.location.search);
  if (params.get("role")) selectRole(params.get("role"));
});

// highlights the selected role button and sets the hidden input
function selectRole(role) {
  document.getElementById("role").value = role;
  document.getElementById("btn-owner").classList.toggle("selected",    role === "owner");
  document.getElementById("btn-coworker").classList.toggle("selected", role === "coworker");
}

async function handleSignup() {
  var name     = document.getElementById("name").value.trim();
  var phone    = document.getElementById("phone").value.trim();
  var email    = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;
  var role     = document.getElementById("role").value;

  if (!role)                          return showMessage("message", "Please select a role.", true);
  if (!name)                          return showMessage("message", "Please enter your full name.", true);
  if (!phone)                         return showMessage("message", "Please enter your phone number.", true);
  if (!email || !email.includes("@")) return showMessage("message", "Please enter a valid email.", true);
  if (password.length < 6)            return showMessage("message", "Password must be at least 6 characters.", true);

  var result = await addUser({ name, phone, email, password, role });

  if (!result.success) {
    return showMessage("message", result.error, true);
  }

  showMessage("message", "Account created! Redirecting to login...", false);
  setTimeout(function () { window.location.href = "login.html"; }, 1500);
}