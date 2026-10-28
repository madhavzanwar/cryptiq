/** Keyboard-shortcut helpers: when a key press belongs to the page and when it belongs to a control. */

const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel", "password", "number", ""]);

/** True while the person is typing (text field, textarea, select, contenteditable). Checkboxes and buttons do not count. */
export function isTextEntry(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
  if (el instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(el.type);
  return false;
}

/** A focused control other than the mic that already uses Space/Enter (button, link, tab, radio, checkbox). */
export function isOtherControl(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.closest("[data-mic]")) return false;
  if (el.closest("a,button,summary,[role=button],[role=tab],[role=radio]")) return true;
  return el instanceof HTMLInputElement && !TEXT_INPUT_TYPES.has(el.type);
}
