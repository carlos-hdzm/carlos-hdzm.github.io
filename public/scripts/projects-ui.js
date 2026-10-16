window.customElements.define(
  "project-li",
  class extends HTMLElement {
    constructor() {
      super();
      let template = document.getElementById("project-template");
      let templateContent = template.content;

      const shadowRoot = this.attachShadow({
        mode: "open",
        slotAssignment: "manual",
      });
      shadowRoot.appendChild(document.importNode(templateContent, true));
    }
  },
);

window.customElements.define(
  "tool-li",
  class extends HTMLElement {
    constructor() {
      super();
      let template = document.getElementById("tool-template");
      let templateContent = template.content;

      const shadowRoot = this.attachShadow({
        mode: "open",
        slotAssignment: "manual",
      });
      shadowRoot.appendChild(document.importNode(templateContent, true));
    }
  },
);

const populateProjects = (projectList) => {
  const projectListContainer = document.querySelector("#projects ul");
  const thisPortfolioProject = document.getElementById("this-portfolio");
  const projectListFragment = document.createDocumentFragment();

  projectList
    .filter((project) => {
      return (
        project.name &&
        project.type &&
        project.url &&
        project.logo &&
        project.displayName &&
        (project.tools &&
        Array.isArray(project.tools) &&
        project.tools[0]) &&
        project.description &&
        project?.screenshot.src
      );
    })
    .forEach((project) => {
      const projectElement = document.createElement("project-li");
      const shadowRoot = projectElement.shadowRoot;

      const headerLink = shadowRoot.querySelector(".project-header a");
      headerLink.setAttribute("href", project.url);

      const headerImg = document.createElement("img");
      headerImg.setAttribute("src", project.logo);
      headerImg.setAttribute("alt", `${project.displayName} logo`);
      const logoSlot = shadowRoot.querySelector('slot[name="logo"]');
      projectElement.appendChild(headerImg);
      logoSlot.assign(headerImg);

      const nameSpan = document.createElement("span");
      nameSpan.textContent = project.displayName;
      const nameSlot = shadowRoot.querySelector('slot[name="name"]');
      projectElement.appendChild(nameSpan);
      nameSlot.assign(nameSpan);

      // An undefined version means the version couldn't be retrieved
      const versionText = document.createTextNode(
        project?.version || "Version unavailable",
      );
      const versionSlot = shadowRoot.querySelector('slot[name="version"]');
      projectElement.appendChild(versionText);
      versionSlot.assign(versionText);

      const toolsSlot = shadowRoot.querySelector('slot[name="tool-list"]');
      const toolsUl = document.createElement("ul");
      const toolsFragment = document.createDocumentFragment();
      project.tools.forEach((tool) => {
        const toolLi = document.createElement("tool-li");
        const toolText = document.createTextNode(tool);
        const toolShadowRoot = toolLi.shadowRoot;
        const toolSlot = toolShadowRoot.querySelector('slot[name="tool"]');
        toolLi.appendChild(toolText);
        toolSlot.assign(toolText);
        toolsFragment.appendChild(toolLi);
      });
      toolsUl.appendChild(toolsFragment);
      projectElement.appendChild(toolsUl);
      toolsSlot.assign(toolsUl);

      const descriptionP = document.createElement("p");
      descriptionP.textContent = project.description;
      const descriptionSlot = shadowRoot.querySelector(
        'slot[name="description"]',
      );
      projectElement.appendChild(descriptionP);
      descriptionSlot.assign(descriptionP);

      const screenshotImg = document.createElement("img");
      screenshotImg.setAttribute("src", project.screenshot.src);
      screenshotImg.setAttribute("alt", `${project.displayName} screenshot`);
      screenshotImg.classList.add("project-screenshot");
      if (project.screenshot.attributes) {
        project.screenshot.attributes.forEach((attr) => {
          screenshotImg.setAttribute(attr.name, attr.value);
        });
      }
      const screenshotSlot = shadowRoot.querySelector(
        'slot[name="screenshot"]',
      );
      projectElement.appendChild(screenshotImg);
      screenshotSlot.assign(screenshotImg);

      projectListFragment.appendChild(projectElement);
    });

  projectListContainer.insertBefore(projectListFragment, thisPortfolioProject);
};

export default populateProjects;
