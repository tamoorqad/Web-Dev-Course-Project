// login.js - validates credentials then sets session and redirects

document.addEventListener("DOMContentLoaded", function () {
  updateNavForSession();
  if (getCurrentUser()) window.location.href = "properties.html";
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") handleLogin();
});

async function handleLogin() {
  var email    = document.getElementById("email").value.trim();
  var password = document.getElementById("password").value;

  if (!email)    return showMessage("message", "Please enter your email.", true);
  if (!password) return showMessage("message", "Please enter your password.", true);

  var result = await loginUser(email, password);

  if (!result.success) {
    return showMessage("message", result.error, true);
  }

  setCurrentUser(result.user);
  showMessage("message", "Welcome back, " + result.user.name + "! Redirecting...", false);
  setTimeout(function () { window.location.href = "properties.html"; }, 1200);
}