
const projects = [];

const form = document.querySelector("#project-form");
const nameInput = document.querySelector("#name");
const statusInput = document.querySelector("#status");
const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");

let editingId = null;

// Restore the form to Add mode
function resetForm() {
  form.reset();
  editingId = null;
  saveButton.textContent = "Save Project";
  cancelButton.hidden = true;
}

// Display all projects with their Edit and Delete buttons
function renderProjects() {
  projectList.replaceChildren();

  projects.forEach(function (project) {
    const item = document.createElement("li");
    const details = document.createElement("span");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    // Display user-entered text safely
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

      // Ask for confirmation before deleting
      const confirmed = window.confirm(
        'Delete the project "' + projectToDelete.name + '"?'
      );

      // Cancel leaves the collection unchanged
      if (!confirmed) {
        return;
      }

      // Remove only the project with the matching ID
      const projectIndex = projects.findIndex(function (currentProject) {
        return currentProject.id === projectToDelete.id;
      });

      if (projectIndex === -1) {
        return;
      }

      projects.splice(projectIndex, 1);

      // If the deleted project was being edited, reset the form
      if (editingId === projectToDelete.id) {
        resetForm();
      }

      // Refresh the list and empty-state message
      renderProjects();
    });

    item.appendChild(details);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(editButton);
    item.appendChild(document.createTextNode(" "));
    item.appendChild(deleteButton);

    projectList.appendChild(item);
  });

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }
}

// Handle both adding and updating projects
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;

  // Reject an empty or whitespace-only name
  if (name === "") {
    nameInput.focus();
    return;
  }

  if (editingId !== null) {
    // Update the existing project without changing its ID
    const projectToUpdate = projects.find(function (project) {
      return project.id === editingId;
    });

    if (!projectToUpdate) {
      resetForm();
      renderProjects();
      return;
    }

    projectToUpdate.name = name;
    projectToUpdate.status = status;
  } else {
    // Add a new project
    projects.push({
      id: crypto.randomUUID(),
      name: name,
      status: status
    });
  }

  renderProjects();
  resetForm();
});

// Cancel editing without changing the stored project
cancelButton.addEventListener("click", function () {
  resetForm();
  renderProjects();
});

// Display the initial empty state
renderProjects();
