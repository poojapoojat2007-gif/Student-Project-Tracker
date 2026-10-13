
const STORAGE_KEY = "workshop-projects-v1";
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

// Show a message without interpreting it as HTML
function showMessage(text) {
  message.textContent = text;
}

// Restore the form to Add mode
function resetForm() {
  form.reset();
  editingId = null;
  saveButton.textContent = "Save Project";
  cancelButton.hidden = true;
}

// Check that stored projects have the expected structure
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
      typeof project.id !== "string" ||
      project.id.trim() === "" ||
      typeof project.name !== "string" ||
      project.name.trim() === "" ||
      project.name.length > 80 ||
      typeof project.status !== "string" ||
      !["Planned", "In Progress", "Completed"].includes(project.status) ||
      seenIds.has(project.id)
    ) {
      return false;
    }

    seenIds.add(project.id);
    return true;
  });
}

// Read projects when the page starts
function loadProjects() {
  let savedText;

  try {
    savedText = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    showMessage(
      "Could not read browser storage. Projects could not be loaded or saved reliably."
    );
    return;
  }

  // No stored value means start with an empty collection
  if (savedText === null) {
    return;
  }

  let savedProjects;

  try {
    // Turn stored text back into JavaScript data
    savedProjects = JSON.parse(savedText);
  } catch (error) {
    showMessage(
      "Saved project data is malformed. It has not been overwritten."
    );
    return;
  }

  if (!isValidProjectArray(savedProjects)) {
    showMessage(
      "Saved project data is invalid. It has not been overwritten."
    );
    return;
  }

  savedProjects.forEach(function (project) {
    projects.push(project);
  });
}

// Store the collection as text
function saveProjects() {
  try {
    const savedText = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY, savedText);
    showMessage("Projects saved in this browser.");
    return true;
  } catch (error) {
    showMessage(
      "Changes could not be saved. Browser storage may be unavailable or full."
    );
    return false;
  }
}

// Display all projects with their Edit and Delete buttons
function renderProjects() {
  projectList.replaceChildren();

  projects.forEach(function (project) {
    const item = document.createElement("li");
    const details = document.createElement("span");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    details.textContent = project.name + " - " + project.status;

    // Edit button
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.projectId = project.id;

    editButton.addEventListener("click", function () {
      const selectedProject = projects.find(function (currentProject) {
        return currentProject.id === editButton.dataset.projectId;
      });

      if (!selectedProject) {
        return;
      }

      editingId = selectedProject.id;
      nameInput.value = selectedProject.name;
      statusInput.value = selectedProject.status;

      saveButton.textContent = "Save changes";
      cancelButton.hidden = false;
      nameInput.focus();
    });

    // Delete button
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.projectId = project.id;

    deleteButton.addEventListener("click", function () {
      const projectToDelete = projects.find(function (currentProject) {
        return currentProject.id === deleteButton.dataset.projectId;
      });

      if (!projectToDelete) {
        return;
      }

      const confirmed = window.confirm(
        'Delete the project "' + projectToDelete.name + '"?'
      );

      // Cancel does not change the collection
      if (!confirmed) {
        return;
      }

      const projectIndex = projects.findIndex(function (currentProject) {
        return currentProject.id === projectToDelete.id;
      });

      if (projectIndex === -1) {
        return;
      }

      projects.splice(projectIndex, 1);

      // Reset the form if the deleted project was being edited
      if (editingId === projectToDelete.id) {
        resetForm();
      }

      renderProjects();
      saveProjects();
    });

    item.appendChild(details);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(editButton);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(deleteButton);

    projectList.appendChild(item);
  });

  emptyState.hidden = projects.length > 0;
}

// Handle adding and updating projects
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === "") {
    nameInput.focus();
    showMessage("Please enter a project name.");
    return;
  }

  if (editingId !== null) {
    const projectToUpdate = projects.find(function (project) {
      return project.id === editingId;
    });

    if (!projectToUpdate) {
      resetForm();
      renderProjects();
      showMessage("The project could not be found. Please try again.");
      return;
    }

    // Update the project while preserving its ID
    projectToUpdate.name = name;
    projectToUpdate.status = status;
  } else {
    // Add a new project with a stable ID
    projects.push({
      id: crypto.randomUUID(),
      name: name,
      status: status
    });
  }

  renderProjects();
  resetForm();
  saveProjects();
});

// Cancel editing without changing saved records
cancelButton.addEventListener("click", function () {
  resetForm();
  renderProjects();
  showMessage("Edit cancelled. No changes were saved.");
});

// Load saved projects before displaying the list
loadProjects();
renderProjects();
