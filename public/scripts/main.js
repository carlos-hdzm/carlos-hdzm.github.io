document.addEventListener("DOMContentLoaded", () => {
  const colorSchemeToggle = document.getElementById("color-scheme-toggle");

  (function getAndSetColorScheme() {
    if (window.localStorage.getItem("colorScheme")) {
      document.documentElement.dataset.colorScheme =
        window.localStorage.getItem("colorScheme");
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.documentElement.dataset.colorScheme = "dark";
      window.localStorage.setItem("colorScheme", "dark");
    } else {
      document.documentElement.dataset.colorScheme = "light";
      window.localStorage.setItem("colorScheme", "light");
    }

    const currentScheme = document.documentElement.dataset.colorScheme;
    document
      .getElementById(`color-scheme-${currentScheme}`)
      .classList.add("active");
  })();

  colorSchemeToggle.addEventListener("click", () => {
    const currentScheme = document.documentElement.dataset.colorScheme;
    const newScheme = currentScheme === "dark" ? "light" : "dark";
    document.documentElement.dataset.colorScheme = newScheme;
    window.localStorage.setItem("colorScheme", newScheme);
    document
      .getElementById(`color-scheme-${currentScheme}`)
      .classList.remove("active");
    document
      .getElementById(`color-scheme-${newScheme}`)
      .classList.add("active");
  });
});
