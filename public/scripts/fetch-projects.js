import populateProjects from "./projects-ui.js";

const APIS = {
  VS_MARKETPLACE: {
    /* Built with information from
     * VSCode API implementation: https://github.com/microsoft/vscode/blob/main/src/vs/platform/extensionManagement/common/extensionGalleryService.ts
     * VSCode API documentation: https://github.com/zx0r/vscode-api
     */
    URL: "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
    VERSION: "7.2-preview.1",
    // FilterType documentation: https://learn.microsoft.com/en-us/javascript/api/azure-devops-extension-api/extensionqueryfiltertype
    FILTERS: {
      PUBLISHER: 18,
    },
    // Flags documentation: https://learn.microsoft.com/en-us/javascript/api/azure-devops-extension-api/extensionqueryflags
    FLAGS: {
      // 0x200 to fetch the latest version
      // 0x100 to fetch extension stats
      // 0x1 to include version list
      LATEST_VERSION_ONLY: 0x200,
      STATISTICS: 0x100,
      VERSIONS: 0x1,
    },
  },
  GITHUB: window.LOCAL_API_URL || "/api/fetch-github",
};
const PUBLISHER = "carlos-hdzm";
const LOCAL_SECRET = window.LOCAL_SECRET || "";
const PROJECTS_PATH = "/public/assets/content/projects.json";

const useVSMarketPlaceFlags = (flags) => {
  const availableFlags = APIS.VS_MARKETPLACE.FLAGS;
  // Enable each flag in flags with an OR operation
  // Nonexistent flags are turned to 0
  return flags.reduce(
    (flagValue, flag) =>
      flagValue |
      (availableFlags.hasOwnProperty(flag) ? availableFlags[flag] : 0),
    0,
  );
};

const fetchExtensionsVersion = async (extensionList) => {
  try {
    const VSMarketplaceProps = APIS.VS_MARKETPLACE;
    const response = await fetch(VSMarketplaceProps.URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: `application/json;api-version=${VSMarketplaceProps.VERSION}`,
      },
      body: JSON.stringify({
        filters: [
          {
            criteria: [
              {
                filterType: VSMarketplaceProps.FILTERS.PUBLISHER,
                value: PUBLISHER,
              },
            ],
          },
        ],
        flags: useVSMarketPlaceFlags([
          "LATEST_VERSION_ONLY",
          "STATISTICS",
          "VERSIONS",
        ]),
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
          versions[extension.extensionName] = latestVersion
            ? `v${latestVersion}`
            : null;
          return versions;
        },
        {},
      );
      return extensionsVersions;
    } else {
      console.error("Error fetching extension versions");
      return { _error: true };
    }
  } catch (error) {
    console.error("Error fetching extension versions");
    return { _error: true };
  }
};

const fetchRepoVersion = async (repoList) => {
  try {
    const response = await fetch(APIS.GITHUB, {
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
    const { default: projectList } = await import(PROJECTS_PATH, {
      with: { type: "json" },
    });

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
      .filter(
        (project) =>
          project.type === "repo" ||
          project.version === null ||
          project.version === undefined,
      )
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
