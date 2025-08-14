(function(){

  let keyboardContainer = null;
  let keyboardFrame = null;
  let lastFocusedElement = null;
  let currentLang = "de";
  let currentTheme = "light";
  let currentVisibility = "alwayson";
  let currentPosition = "bottom-center"; 
  

  let dragHandle = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

    ;(function injectPageContext() {
      const s = document.createElement("script");
        s.src = chrome.runtime.getURL("inject.js");
        s.onload = () => s.remove();
     (document.head || document.documentElement).appendChild(s);
    })();

  chrome.storage.local.get(["oskLang", "oskTheme", "oskVisibility", "oskPosition"], res => {
    if (res.oskLang) currentLang = res.oskLang;
    if (res.oskTheme) currentTheme = res.oskTheme;
    if (res.oskVisibility) currentVisibility = res.oskVisibility;
    if (res.oskPosition) currentPosition = res.oskPosition;
    createKeyboard();
    initListeners();
      if (currentVisibility === "alwayson") {
      showKeyboard();
      }
  });

  function initListeners() {
    document.addEventListener("focus", e => {
      let t = e.target;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) {
        lastFocusedElement = t;
        if (currentVisibility !== "alwaysoff") {
          showKeyboard();
        }
      }
    }, true);
    
    document.addEventListener("blur", e => {
      if (e.target === lastFocusedElement) {
        setTimeout(() => {
          let a = document.activeElement;
          if (currentVisibility === "alwayson") return;
          if (a !== keyboardFrame && !(a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable))) {
            hideKeyboard();
          }
        }, 50);
      }
    }, true);

  }
  
 function createKeyboard() {
  if (keyboardContainer) return;

  keyboardContainer = document.createElement("div");
  keyboardContainer.className = "keyboard-container";
  keyboardContainer.style.position = "fixed";
  keyboardContainer.style.zIndex = "99999999";
  updateKeyboardPosition();
  if (currentPosition === "drag") createDragHandle();
  const htmlFile = `keyboard-${currentLang}.html`;
  keyboardFrame = document.createElement("iframe");
  keyboardFrame.src = chrome.runtime.getURL(htmlFile);
  keyboardFrame.style.width = "900px";
  keyboardFrame.style.height = "300px";
  keyboardFrame.style.border = "0";
  keyboardFrame.style.borderRadius = "10px";
  keyboardFrame.style.overflow = "hidden";
  keyboardFrame.style.display = "none";
  keyboardContainer.appendChild(keyboardFrame);
  document.body.appendChild(keyboardContainer);
  applyKeyboardTheme(currentTheme);
}
  function updateKeyboardPosition() {
    if (!keyboardContainer) return;
    keyboardContainer.style.top = "";
    keyboardContainer.style.bottom = "";
    keyboardContainer.style.left = "";
    keyboardContainer.style.right = "";
    keyboardContainer.style.transform = "";
    
    if (currentPosition === "drag") {
      keyboardContainer.style.bottom = "0";
      keyboardContainer.style.left = "50%";
      keyboardContainer.style.transform = "translateX(-50%)";
      return;
    }
    
    removeDragHandle();
    
    switch (currentPosition) {
      case "top-left":
        keyboardContainer.style.top = "0";
        keyboardContainer.style.left = "0";
        break;
      case "top-center":
        keyboardContainer.style.top = "0";
        keyboardContainer.style.left = "50%";
        keyboardContainer.style.transform = "translateX(-50%)";
        break;
      case "top-right":
        keyboardContainer.style.top = "0";
        keyboardContainer.style.right = "0";
        break;
      case "bottom-left":
        keyboardContainer.style.bottom = "0";
        keyboardContainer.style.left = "0";
        break;
      case "bottom-center":
        keyboardContainer.style.bottom = "0";
        keyboardContainer.style.left = "50%";
        keyboardContainer.style.transform = "translateX(-50%)";
        break;
      case "bottom-right":
        keyboardContainer.style.bottom = "0";
        keyboardContainer.style.right = "0";
        break;
      default:
        keyboardContainer.style.bottom = "0";
        keyboardContainer.style.left = "50%";
        keyboardContainer.style.transform = "translateX(-50%)";
    }
  }
  
  
  function createDragHandle() {
    if (dragHandle) return;
    dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.style.position = "absolute";
    dragHandle.style.top = "-12px";        
    dragHandle.style.left = "-12px";       
    dragHandle.style.width = "32px";
    dragHandle.style.height = "32px";
    dragHandle.style.borderRadius = "50%";
    dragHandle.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    dragHandle.style.cursor = "move";
    dragHandle.style.display = "flex";
    dragHandle.style.alignItems = "center";
    dragHandle.style.justifyContent = "center";
    dragHandle.style.zIndex = "1000000";
    dragHandle.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M12 2 L12 22 M2 12 L22 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    dragHandle.addEventListener("mousedown", startDrag);
    keyboardContainer.appendChild(dragHandle);
  }
  
  
  function removeDragHandle() {
    if (dragHandle) {
      dragHandle.removeEventListener("mousedown", startDrag);
      dragHandle.remove();
      dragHandle = null;
    }
  }
  
  function startDrag(e) {
    isDragging = true;
    const rect = keyboardContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
  }
  
  function doDrag(e) {
    if (!isDragging) return;
    keyboardContainer.style.top = (e.clientY - dragOffset.y) + "px";
    keyboardContainer.style.left = (e.clientX - dragOffset.x) + "px";
    keyboardContainer.style.transform = "";
  }
  
  function stopDrag(e) {
    isDragging = false;
    document.removeEventListener("mousemove", doDrag);
    document.removeEventListener("mouseup", stopDrag);
  }
  
  function showKeyboard() {
    if (!keyboardFrame) createKeyboard();
    if (shouldShowKeyboard()) {
      keyboardFrame.style.display = "block";
    }
  }
  
  function hideKeyboard() {
    if (keyboardFrame) keyboardFrame.style.display = "none";
  }
  
  function shouldShowKeyboard() {
    if (currentVisibility === "alwayson") return true;
    if (currentVisibility === "alwaysoff") return false;
    return true;
  }
  
  chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.oskVisibility) {
    const newVisibility = changes.oskVisibility.newValue;
    if (newVisibility !== currentVisibility) {
      currentVisibility = newVisibility;
      if (currentVisibility === "alwayson") {
        showKeyboard();
      } else if (currentVisibility === "alwaysoff") {
        hideKeyboard();
      }
    }
  }

  if (changes.oskLang) {
    const newLang = changes.oskLang.newValue;
    if (newLang !== currentLang) {
      currentLang = newLang;
      if (keyboardFrame) {
        const htmlFile = `keyboard-${currentLang}.html`;
        keyboardFrame.src = chrome.runtime.getURL(htmlFile);
      }
    }
  }

  if (changes.oskTheme) {
    const newTheme = changes.oskTheme.newValue;
    if (newTheme !== currentTheme) {
      currentTheme = newTheme;
      applyKeyboardTheme(currentTheme);
    }
  }

  if (changes.oskPosition) {
    const newPosition = changes.oskPosition.newValue;
    if (newPosition !== currentPosition) {
      currentPosition = newPosition;
      updateKeyboardPosition();
      if (currentPosition === "drag") {
        createDragHandle();
      } else {
        removeDragHandle();
      }
    }
  }
});

  function applyKeyboardTheme(theme) {
    if (keyboardFrame) {
      keyboardFrame.contentWindow.postMessage({ type: "setTheme", theme: theme }, "*");
    }
  }
})();
