document.addEventListener("DOMContentLoaded", () => {
  const themeSelect      = document.getElementById("themeSelect");
  const langSelect       = document.getElementById("langSelect");
  const visibilitySelect = document.getElementById("visibilitySelect");
  const positionSelect   = document.getElementById("positionSelect");
  const languages = [
    { code: "de", name: "Deutsch" },
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "ru", name: "Русский" },
    { code: "ar", name: "العربية" }
  ];
  langSelect.innerHTML = "";
  languages.forEach(({code, name}) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    langSelect.appendChild(opt);
  });
  chrome.storage.local.get(
    ["oskTheme", "oskLang", "oskVisibility", "oskPosition"],
    res => {
      // Theme
      if (res.oskTheme) {
        themeSelect.value = res.oskTheme;
        applyPopupTheme(res.oskTheme);
      } else {
        themeSelect.value = "light";
        applyPopupTheme("light");
        chrome.storage.local.set({oskTheme: "light"});
      }

      // Language
      if (res.oskLang && languages.some(l => l.code === res.oskLang)) {
        langSelect.value = res.oskLang;
      } else {
        langSelect.value = "de";
        chrome.storage.local.set({oskLang: "de"});
      }

      // Visibility
      if (res.oskVisibility) {
        visibilitySelect.value = res.oskVisibility;
      } else {
        visibilitySelect.value = "alwayson";
        chrome.storage.local.set({oskVisibility: "alwayson"});
      }

      // Position
      if (res.oskPosition) {
        positionSelect.value = res.oskPosition;
      } else {
        positionSelect.value = "bottom-center";
        chrome.storage.local.set({oskPosition: "bottom-center"});
      }
    }
  );

  themeSelect.addEventListener("change", () => {
    const t = themeSelect.value;
    chrome.storage.local.set({oskTheme: t});
    applyPopupTheme(t);
  });

  langSelect.addEventListener("change", () => {
    chrome.storage.local.set({oskLang: langSelect.value});
  });

  visibilitySelect.addEventListener("change", () => {
    chrome.storage.local.set({oskVisibility: visibilitySelect.value});
  });

  positionSelect.addEventListener("change", () => {
    chrome.storage.local.set({oskPosition: positionSelect.value});
  });
});

function applyPopupTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}
