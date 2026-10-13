
const projects = [];

const form = document.querySelector("#project-form");
const nameInput = document.querySelector("#name");
const statusInput = document.querySelector("#status");
const projectList = document.querySelector("#project-list");
const emptyState = document.querySelector("#empty-state");

// Display all projects stored in the array
function renderProjects() {
  // Clear the existing list to prevent duplicates
  projectList.replaceChildren();

  // Create a list item for every project
  projects.forEach(function (project) {
    const item = document.createElement("li");

    item.textContent = project.name + " - " + project.status;

    projectList.appendChild(item);
  });

  // Update the empty-state message
  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }
}

// Handle form submission (only one submit listener)
form.addEventListener("submit", function (event) {
  event.preventDefault();

  // Read the current form values
  const name = nameInput.value.trim();
  const status = statusInput.value;

  // Reject an empty project name
  if (name === "") {
    nameInput.focus();
    return;
  }

  // Create a new project with a unique ID
  const project = {
    id: crypto.randomUUID(),
    name: name,
    status: status
  };

  // Store the new project
  projects.push(project);

  // Refresh the displayed project list
  renderProjects();

  // Clear the form for the next project
  form.reset();
});

// Show the initial empty state
renderProjects();
