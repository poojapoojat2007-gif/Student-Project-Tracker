
const projects = [];

const form = document.querySelector("#project-form");
const nameInput = document.querySelector("#name");
const statusInput = document.querySelector("#status");
const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");
const message = document.querySelector("#message");

let editingId = null;
let collectionLoaded = false;
let busy = false;

// Display messages safely.
function showMessage(text) {
  message.textContent = text;
}

// Disable controls while a request is running.
function setBusy(value) {
  busy = value;

  saveButton.disabled = value;
  cancelButton.disabled = value;

  projectList.querySelectorAll("button").forEach(function (button) {
    button.disabled = value;
  });
}

// Restore the form to Add mode.
function resetForm() {
  form.reset();
  editingId = null;
  saveButton.textContent = "Save Project";
  cancelButton.hidden = true;
}

// Read an API error message, if one is provided.
async function getErrorMessage(response) {
  try {
    const data = await response.json();

    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch (error) {
    // The server may not have returned JSON.
  }

  return `Request failed (HTTP ${response.status}).`;
}

// Validate the collection returned by the API.
function isValidProjectArray(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  const seenIds = new Set();

  return data.every(function (project) {
    if (
      project === null ||
      typeof project !== "object" ||
      Array.isArray(project) ||
      !(
        (typeof project.id === "number" &&
          Number.isSafeInteger(project.id) &&
          project.id > 0) ||
        (typeof project.id === "string" &&
          project.id.trim() !== "")
      ) ||
      typeof project.name !== "string" ||
      project.name.trim() === "" ||
      project.name.length > 80 ||
      !["Planned", "In Progress", "Completed"].includes(project.status)
    ) {
      return false;
    }

    const idKey = String(project.id);

    if (seenIds.has(idKey)) {
      return false;
    }

    seenIds.add(idKey);
    return true;
  });
}

// Load the authoritative project collection from the API.
async function loadProjects(options = {}) {
  const manageBusy = options.manageBusy !== false;
  const showLoading = options.showLoading !== false;

  if (manageBusy) {
    setBusy(true);
  }

  if (showLoading) {
    showMessage("Loading projects...");
  }

  try {
    const response = await fetch("/api/projects");

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const data = await response.json();

    if (!isValidProjectArray(data)) {
      throw new Error("The server returned invalid project data.");
    }

    // Replace, rather than append, to prevent duplicate records.
    projects.splice(0, projects.length, ...data);
    collectionLoaded = true;

    // If the edited record no longer exists, leave Edit mode.
    if (
      editingId !== null &&
      !projects.some(
        (project) => String(project.id) === String(editingId)
      )
    ) {
      resetForm();
    }

    renderProjects();
    return { ok: true };
  } catch (error) {
    const detail =
      error instanceof TypeError
        ? "Could not connect to the server. Check that it is running and try again."
        : error.message;

    renderProjects();
    showMessage(`Could not load projects: ${detail}`);

    return { ok: false, error: detail };
  } finally {
    if (manageBusy) {
      setBusy(false);
    }
  }
}

// Display projects with Edit and Delete buttons.
function renderProjects() {
  projectList.replaceChildren();

  projects.forEach(function (project) {
    const item = document.createElement("li");
    const details = document.createElement("span");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    // Use textContent so entered names are displayed as text.
    details.textContent = `${project.name} - ${project.status}`;

    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.projectId = String(project.id);
    editButton.disabled = busy;

    editButton.addEventListener("click", function () {
      if (busy) return;

      const selectedProject = projects.find(
        (current) =>
          String(current.id) === editButton.dataset.projectId
      );

      if (!selectedProject) return;

      editingId = selectedProject.id;
      nameInput.value = selectedProject.name;
      statusInput.value = selectedProject.status;

      saveButton.textContent = "Save changes";
      cancelButton.hidden = false;
      showMessage("Editing project. Save changes or cancel.");
      nameInput.focus();
    });

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.projectId = String(project.id);
    deleteButton.disabled = busy;

    deleteButton.addEventListener("click", async function () {
      if (busy) return;

      const projectToDelete = projects.find(
        (current) =>
          String(current.id) === deleteButton.dataset.projectId
      );

      if (!projectToDelete) return;

      const confirmed = window.confirm(
        `Delete the project "${projectToDelete.name}"?`
      );

      // Cancellation must not send a request.
      if (!confirmed) return;

      setBusy(true);
      showMessage("Deleting project...");

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectToDelete.id)}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        if (
          editingId !== null &&
          String(editingId) === String(projectToDelete.id)
        ) {
          resetForm();
        }

        const result = await loadProjects({
          manageBusy: false,
          showLoading: false
        });

        if (result.ok) {
          showMessage("Project deleted successfully.");
        } else {
          showMessage(
            `Project deleted, but the list could not be refreshed: ${result.error}`
          );
        }
      } catch (error) {
        const detail =
          error instanceof TypeError
            ? "Could not connect to the server. Check your connection and try again."
            : error.message;

        showMessage(`Could not delete project: ${detail}`);
      } finally {
        setBusy(false);
      }
    });

    item.appendChild(details);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(editButton);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(deleteButton);

    projectList.appendChild(item);
  });

  // A failed initial load must not look like a successfully empty list.
  emptyState.hidden = !collectionLoaded || projects.length > 0;
}

// There is only one form submit listener.
form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (busy) return;

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === "") {
    nameInput.focus();
    showMessage("Please enter a project name.");
    return;
  }

  if (name.length > 80) {
    showMessage("Project name must be 80 characters or fewer.");
    return;
  }

  if (!["Planned", "In Progress", "Completed"].includes(status)) {
    showMessage("Please select a valid project status.");
    return;
  }

  // Editing must refer to a project currently in the API collection.
  if (
    editingId !== null &&
    !projects.some(
      (project) => String(project.id) === String(editingId)
    )
  ) {
    resetForm();
    renderProjects();
    showMessage("Project not found. Please try again.");
    return;
  }

  const wasEditing = editingId !== null;
  const targetId = editingId;
  const url = wasEditing
    ? `/api/projects/${encodeURIComponent(targetId)}`
    : "/api/projects";

  setBusy(true);
  showMessage(wasEditing ? "Saving changes..." : "Saving project...");

  try {
    const response = await fetch(url, {
      method: wasEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, status })
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    // Only reset after the mutation itself succeeds.
    resetForm();

    const result = await loadProjects({
      manageBusy: false,
      showLoading: false
    });

    if (result.ok) {
      showMessage(
        wasEditing
          ? "Project updated successfully."
          : "Project added successfully."
      );
    } else {
      showMessage(
        `Project was saved, but the list could not be refreshed: ${result.error}`
      );
    }
  } catch (error) {
    const detail =
      error instanceof TypeError
        ? "Could not connect to the server. Check that it is running and try again."
        : error.message;

    // Keep the current input and Edit mode if the mutation fails.
    showMessage(
      `${wasEditing ? "Could not update project" : "Could not add project"}: ${detail}`
    );
  } finally {
    setBusy(false);
  }
});

// Cancel editing without sending an API request.
cancelButton.addEventListener("click", function () {
  if (busy) return;

  resetForm();
  renderProjects();
  showMessage("Edit cancelled. No changes were saved.");
});

// Load the API collection when the page opens.
loadProjects();
