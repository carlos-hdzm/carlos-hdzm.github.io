import populateProjects from "./projects-ui.js";

const APIS = {
  VS_MARKETPLACE:
    window.LOCAL_API_URL?.VS_MARKETPLACE || "/api/project-data/vs-marketplace",
  GITHUB: window.LOCAL_API_URL?.GITHUB || "/api/project-data/github",
};
const LOCAL_SECRET = window.LOCAL_SECRET || "";
const PROJECTS_PATH = "/public/assets/content/projects.json";

const fetchProjectData = async (url, body, errorMessage) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Local-Secret": LOCAL_SECRET,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error(errorMessage);
      return { _error: true };
    }
  } catch (error) {
    console.error(errorMessage);
    return { _error: true };
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { default: projectList } = await import(PROJECTS_PATH, {
      with: { type: "json" },
    });

    // Fetch versions for extensions
    const extensionList = projectList
      .filter((project) => project.type === "extension")
      .map((project) => project.name);

    const extensionVersions = await fetchProjectData(
      APIS.VS_MARKETPLACE,
      { extensionList },
      "Error fetching extension data",
    );

    if (!extensionVersions._error) {
      for (const extensionName in extensionVersions) {
        if (extensionVersions.hasOwnProperty(extensionName)) {
          const { version, installs } = extensionVersions[extensionName];
          const project = projectList.find((p) => p.name === extensionName);
          if (project) {
            project.version = version;
            if (installs) project.installs = installs;
          }
        }
      }
    }

    // Fetch versions for repositories and extensions with null versions
    let repoList = projectList
      .filter(
        (project) =>
          project.type === "repo" ||
          project.version === null ||
          project.version === undefined,
      )
      .map((project) => project.name);

    const repoVersions = await fetchProjectData(
      APIS.GITHUB,
      { repoList },
      "Error fetching repo versions",
    );

    if (!repoVersions._error) {
      for (const repoName in repoVersions) {
        if (repoVersions.hasOwnProperty(repoName)) {
          const version = repoVersions[repoName];
          const project = projectList.find((p) => p.name === repoName);
          if (project) {
            project.version = version;
          }
        }
      }
    }

    // Ignore projects with null version as they are non-existing projects
    populateProjects(projectList.filter((project) => !!project.version));
  } catch (error) {
    console.error("Error fetching project versions");
  }
});
