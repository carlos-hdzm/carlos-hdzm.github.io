import populateProjects from "./projects-ui.js";

const API_URLS = {
  VSCODE_MARKETPLACE:
    "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
  GITHUB: window.LOCAL_API_URL || "/api/fetch-github",
};
const PUBLISHER = "carlos-hdzm";
const LOCAL_SECRET = window.LOCAL_SECRET || "";
const PROJECTS_PATH = "/public/assets/content/projects.json";

/* Built with information from
 * VSCode API implementation: https://github.com/microsoft/vscode/blob/main/src/vs/platform/extensionManagement/common/extensionGalleryService.ts
 * VSCode API documentation: https://github.com/zx0r/vscode-api
 * FilterType documentation: https://learn.microsoft.com/en-us/javascript/api/azure-devops-extension-api/extensionqueryfiltertype
 * Flags documentation: https://learn.microsoft.com/en-us/javascript/api/azure-devops-extension-api/extensionqueryflags
 */
const fetchExtensionsVersion = async (extensionList) => {
  try {
    const response = await fetch(API_URLS.VSCODE_MARKETPLACE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;api-version=7.2-preview.1",
      },
      body: JSON.stringify({
        filters: [
          {
            criteria: [
              {
                filterType: 18, // Search by publisher
                value: PUBLISHER,
              },
            ],
          },
        ],
        flags: 513, // Combining flag 0x200 to fetch the latest version and flag 0x1 to include version list
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const extensions = data?.results?.[0]?.extensions || [];
      const selectedExtensions = extensions.filter((ext) =>
        extensionList.includes(ext.extensionName),
      );

      const extensionsVersions = selectedExtensions.reduce(
        (versions, extension) => {
          const latestVersion = extension.versions?.[0]?.version || null;
          versions[extension.extensionName] = latestVersion ? `v${latestVersion}` : null;
          return versions;
        },
        {},
      );
      return extensionsVersions;
    } else {
      console.error("Error fetching repo versions");
      return { _error: true };
    }
  } catch (error) {
    console.error("Error fetching extension versions");
    return { _error: true };
  }
};

const fetchRepoVersion = async (repoList) => {
  try {
    const response = await fetch(API_URLS.GITHUB, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Local-Secret": LOCAL_SECRET,
      },
      body: JSON.stringify({ repoList }),
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error("Error fetching repo versions");
      return { _error: true };
    }
  } catch (error) {
    console.error("Error fetching repo versions");
    return { _error: true };
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const { default: projectList } = await import(PROJECTS_PATH, { with: { type: "json" } });

    // Fetch versions for extensions
    const extensionList = projectList
      .filter((project) => project.type === "extension")
      .map((project) => project.name);

    const extensionVersions = await fetchExtensionsVersion(extensionList);

    if (!extensionVersions._error) {
      for (const extensionName in extensionVersions) {
        if (extensionVersions.hasOwnProperty(extensionName)) {
          const version = extensionVersions[extensionName];
          const project = projectList.find((p) => p.name === extensionName);
          if (project) {
            project.version = version;
          }
        }
      }
    }

    // Fetch versions for repositories and extensions with null versions
    let repoList = projectList
      .filter((project) => project.type === "repo" || project.version === null || project.version === undefined)
      .map((project) => project.name);

    const repoVersions = await fetchRepoVersion(repoList);

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
