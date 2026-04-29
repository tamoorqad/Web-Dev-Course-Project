// hereall localStorage calls are replaced with fetch() calls to the API

// session is stored in sessionStorage so it survives page refreshes
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser")) || null;
}
function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}
function logoutUser() {
  fetch("/api/users/logout", { method: "POST" })
    .then(() => {
      sessionStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
}

// posts new user to the API
async function addUser(user) {
  const res  = await fetch("/api/users/signup", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(user)
  });
  return res.json();
}

// sends credentials to login endpoint and returns result
async function loginUser(email, password) {
  const res  = await fetch("/api/users/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password })
  });
  return res.json();
}

// fetches a user by id, used for owner contact info in the detail modal
async function getUserById(id) {
  const res  = await fetch("/api/users/" + id);
  const data = await res.json();
  return data.success ? data.user : null;
}

// gets all properties, or filters by owner if ownerId is passed
async function getProperties(ownerId) {
  const url  = ownerId ? "/api/properties?ownerId=" + ownerId : "/api/properties";
  const res  = await fetch(url);
  const data = await res.json();
  return data.success ? data.properties : [];
}

// just calls getProperties with the ownerId
async function getPropertiesByOwner(ownerId) {
  return getProperties(ownerId);
}

// posts a new property to the API
async function addProperty(property) {
  const res  = await fetch("/api/properties", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(property)
  });
  return res.json();
}

// updates a property by id
async function updateProperty(id, updates) {
  const res  = await fetch("/api/properties/" + id, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(updates)
  });
  return res.json();
}

// deletes a property, workspaces cascade automatically from the DB
async function deleteProperty(id) {
  const res  = await fetch("/api/properties/" + id, { method: "DELETE" });
  return res.json();
}

// gets all workspaces, or filters by propertyId if passed
async function getWorkspaces(propertyId) {
  const url  = propertyId ? "/api/workspaces?propertyId=" + propertyId : "/api/workspaces";
  const res  = await fetch(url);
  const data = await res.json();
  return data.success ? data.workspaces : [];
}

// just calls getWorkspaces with the propertyId
async function getWorkspacesByProperty(propertyId) {
  return getWorkspaces(propertyId);
}

// posts a new workspace to the API
async function addWorkspace(workspace) {
  const res  = await fetch("/api/workspaces", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(workspace)
  });
  return res.json();
}

// updates a workspace by id
async function updateWorkspace(id, updates) {
  const res  = await fetch("/api/workspaces/" + id, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(updates)
  });
  return res.json();
}

// deletes a workspace by id
async function deleteWorkspace(id) {
  const res  = await fetch("/api/workspaces/" + id, { method: "DELETE" });
  return res.json();
}

// shows a success or error message on the page
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent   = message;
  el.className     = "message " + (isError ? "error" : "success");
  el.style.display = "block";
}

// updates the nav links based on who is logged in
function updateNavForSession() {
  const user      = getCurrentUser();
  const navLogin  = document.getElementById("nav-login");
  const navSignup = document.getElementById("nav-signup");
  const navLogout = document.getElementById("nav-logout");
  const navUser   = document.getElementById("nav-username");
  const navOwner  = document.getElementById("nav-owner-links");

  if (user) {
    if (navLogin)  navLogin.style.display  = "none";
    if (navSignup) navSignup.style.display = "none";
    if (navLogout) navLogout.style.display = "inline-block";
    if (navUser)   navUser.textContent     = user.name;
    if (navOwner && user.role === "owner") navOwner.style.display = "flex";
  } else {
    if (navLogout) navLogout.style.display = "none";
    if (navOwner)  navOwner.style.display  = "none";
  }
}