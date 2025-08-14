(function(){
  let shiftActive = false;
  let capsActive = false;
  let symbolActive = false;
  let ctrlActive = false;

  const layoutAlpha = document.getElementById("layout-alpha");
  const layoutSymbol = document.getElementById("layout-symbol");
  const allKeys = document.querySelectorAll(".key");

  function updateKeyLabelsAlpha(){
    const alphaKeys = layoutAlpha.querySelectorAll(".key");
    alphaKeys.forEach(k => {
      const lowerVal = k.getAttribute("data-lower");
      if (lowerVal) {
        const effectiveUpper = shiftActive ? !capsActive : capsActive;
        k.textContent = effectiveUpper ? lowerVal.toUpperCase() : lowerVal.toLowerCase();
      }
    });
  }

  function showAlphaLayout(){
    symbolActive = false;
    layoutAlpha.style.display = "block";
    layoutSymbol.style.display = "none";
    updateKeyLabelsAlpha();
  }

  function showSymbolLayout(){
    symbolActive = true;
    layoutAlpha.style.display = "none";
    layoutSymbol.style.display = "block";
  }

 allKeys.forEach(key => {
  key.addEventListener("click", () => {
    const dataKey = key.getAttribute("data-key");
    const lowerVal = key.getAttribute("data-lower") || "";

    if (dataKey === "Shift") {
      shiftActive = true;
      key.classList.add("active");
      updateKeyLabelsAlpha();
      return;
    }

    if (dataKey === "CapsLock") {
      capsActive = !capsActive;
      key.classList.toggle("active", capsActive);
      updateKeyLabelsAlpha();
      return;
    }

    if (dataKey === "SymbolToggle") {
      showSymbolLayout();
      parent.postMessage({ type: "keyboard-ui", key: "Refocus" }, "*");
      return;
    }
    if (dataKey === "AlphaToggle") {
      showAlphaLayout();
      parent.postMessage({ type: "keyboard-ui", key: "Refocus" }, "*");
      return;
    }

    if (dataKey === "Backspace" || dataKey === "Enter" || dataKey === "Tab" ||
        dataKey === "Copy" || dataKey === "Paste") {
      parent.postMessage({ type: "keyboard-ui", key: dataKey }, "*");
      if (shiftActive) {
        shiftActive = false;
        const shiftKey = document.querySelector(".key[data-key='Shift']");
        shiftKey?.classList.remove("active");
        updateKeyLabelsAlpha();
      }
      return;
    }

    if (dataKey === " ") {
      parent.postMessage({ type: "keyboard-ui", key: " " }, "*");
      if (shiftActive) {
        shiftActive = false;
        const shiftKey = document.querySelector(".key[data-key='Shift']");
        shiftKey?.classList.remove("active");
        updateKeyLabelsAlpha();
      }
      return;
    }

    let outKey = lowerVal;
    if (!symbolActive) {
      const shouldUpper = shiftActive ? !capsActive : capsActive;
      outKey = shouldUpper
        ? lowerVal.toUpperCase()
        : lowerVal.toLowerCase();
    }
    parent.postMessage({ type: "keyboard-ui", key: outKey, ctrl: ctrlActive }, "*");

    if (ctrlActive) {
      ctrlActive = false;
      const ctrlKeyEl = document.querySelector(".key[data-key='Control']");
      ctrlKeyEl?.classList.remove("active");
    }

    if (shiftActive) {
      shiftActive = false;
      const shiftKey = document.querySelector(".key[data-key='Shift']");
      shiftKey?.classList.remove("active");
      updateKeyLabelsAlpha();
    }
  });
});


  window.addEventListener("message", e => {
    if (e.data.type === "setTheme") {
      if (e.data.theme === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    }
  });

  chrome.storage.local.get(["oskTheme"], res => {
    if (res.oskTheme) {
      if (res.oskTheme === "dark") {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    }
  });

})();
