;(function() {
  if (window.__oskInjected) return;
  window.__oskInjected = true;

  let lastFocused = null;
  let lastCaretPos = 0;

  let backspaceHoldTimeout = null;
  let backspaceRepeatInterval = null;


  document.addEventListener('focusin', e => {
    const t = /** @type {HTMLElement} */(e.target);
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') {
      lastFocused = t;
      const inp = /** @type {HTMLInputElement|HTMLTextAreaElement} */(t);
      if (typeof inp.selectionEnd === 'number') {
        lastCaretPos = inp.selectionEnd;
      }
    } else if (t.isContentEditable) {
      lastFocused = t;
    }
  });

  function fireKey(type, key, ctrl = false) {
    const keyCode =
      key === 'Tab'       ? 9   :
      key === 'Enter'     ? 13  :
      key === 'Backspace' ? 8   :
      key === ' '         ? 32  :
      key.charCodeAt(0);
    const code = /^[a-zA-Z]$/.test(key)
      ? 'Key' + key.toUpperCase()
      : (key === ' ' ? 'Space' : key);
    const evt = new KeyboardEvent(type, {
      key,
      code,
      keyCode,
      which: keyCode,
      ctrlKey: ctrl,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    document.dispatchEvent(evt);
  }

  window.addEventListener('message', e => {
    if (e.data?.type !== 'keyboard-ui') return;
    const key = e.data.key;
    const ctrl = !!e.data.ctrl;
    const el = lastFocused;
    if (!el) return;
  if (key !== 'Backspace') {
    clearTimeout(backspaceHoldTimeout);
    clearInterval(backspaceRepeatInterval);
  }

  function deleteChar() {
    fireKey('keydown','Backspace');
    fireKey('keypress','Backspace');
    if (el.isContentEditable) {
      document.execCommand('delete');
      el.dispatchEvent(new InputEvent('input',{
        inputType: 'deleteContentBackward',
        bubbles:true, cancelable:true
      }));
    } else if ('selectionStart' in el) {
      const inp = el;
      const v = inp.value;
      const s = inp.selectionStart, e = inp.selectionEnd;
      const pos = (s===e && s>0)? s-1 : s;
      try { inp.setRangeText('', pos, e, 'end'); }
      catch { inp.value = v.slice(0,pos) + v.slice(e); }
      inp.setSelectionRange(pos,pos);
      lastCaretPos = pos;
      inp.dispatchEvent(new InputEvent('input',{
        inputType: 'deleteContentBackward',
        bubbles:true, cancelable:true
      }));
    }
    fireKey('keyup','Backspace');
  }
    if (key === 'Refocus') {      el.focus({ preventScroll: true });
      setTimeout(() => {
        if (!lastFocused) return;
        if ('setSelectionRange' in lastFocused) {
          try {
            lastFocused.setSelectionRange(lastCaretPos, lastCaretPos);
          } catch {}
        } else if (lastFocused.isContentEditable) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          const r = document.createRange();
          r.selectNodeContents(lastFocused);
          r.collapse(false);
          sel.addRange(r);
        }
      }, 0);
      return;
    }
     if (key === 'Copy') {
    if (lastFocused.isContentEditable) {
      document.execCommand('copy');
    } else if ('selectionStart' in lastFocused) {
      const inp = /** @type {HTMLInputElement|HTMLTextAreaElement} */(lastFocused);
      const s = inp.selectionStart, e = inp.selectionEnd;
      inp.setSelectionRange(s, e);
      document.execCommand('copy');
      inp.setSelectionRange(lastCaretPos, lastCaretPos);
    }
    return;
  }
  if (key === 'Paste') {
    if (lastFocused.isContentEditable) {
      document.execCommand('paste');
    } else if ('value' in lastFocused) {
      navigator.clipboard.readText().then(text => {
        const inp = /** @type {HTMLInputElement|HTMLTextAreaElement} */(lastFocused);
        const s = inp.selectionStart, e = inp.selectionEnd;
        inp.setRangeText(text, s, e, 'end');
        const pos = s + text.length;
        inp.setSelectionRange(pos, pos);
        lastCaretPos = pos;
        inp.dispatchEvent(new InputEvent('input', {
          inputType: 'insertFromPaste',
          data: text,
          bubbles: true, cancelable: true
        }));
      }).catch(console.error);
    }
    return;
  }
    el.focus({ preventScroll: true });
    if ('setSelectionRange' in el) {
      try {
        el.setSelectionRange(lastCaretPos, lastCaretPos);
      } catch {}
    }
    if (key === 'Tab') {
      ['keydown','keypress','keyup'].forEach(t => fireKey(t, 'Tab', ctrl));
      return;
    }
   if (key === 'Backspace') {
    deleteChar();
    clearTimeout(backspaceHoldTimeout);
    clearInterval(backspaceRepeatInterval);
    backspaceHoldTimeout = setTimeout(() => {
      let speed = 80;
      backspaceRepeatInterval = setInterval(() => {
        deleteChar();
        if (speed > 20) {
          speed = 20;
          clearInterval(backspaceRepeatInterval);
          backspaceRepeatInterval = setInterval(deleteChar, speed);
        }
      }, speed);
    }, 700);
    return;
}

    if (key === 'Enter') {
      ['keydown','keypress','keyup'].forEach(t => fireKey(t, 'Enter', ctrl));
      if (el.form?.submit) el.form.submit();
      else el.click?.();
      return;
    }
    ['keydown','keypress'].forEach(t => fireKey(t, key, ctrl));
    if (el.isContentEditable) {
      document.execCommand('insertText', false, key);
      el.dispatchEvent(new InputEvent('input', {
        inputType: 'insertText',
        data: key,
        bubbles: true, cancelable: true
      }));
    } else if ('selectionStart' in el) {
      const inp = /** @type {HTMLInputElement|HTMLTextAreaElement} */(el);
      const v = inp.value || '';
      const s = inp.selectionStart, e = inp.selectionEnd;
      try {
        inp.setRangeText(key, s, e, 'end');
      } catch {
        inp.value = v.slice(0, s) + key + v.slice(e);
      }
      const pos = s + key.length;
      inp.setSelectionRange(pos, pos);
      lastCaretPos = pos;
      inp.dispatchEvent(new InputEvent('input', {
        inputType: 'insertText',
        data: key,
        bubbles: true, cancelable: true
      }));
    }
    fireKey('keyup', key, ctrl);
  });
})();
