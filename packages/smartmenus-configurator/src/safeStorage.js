// localStorage can be unavailable (blocked by the browser settings, sandboxed iframes, etc.) or contain invalid data

export function readStorage(name) {
  try {
    return JSON.parse(window.localStorage.getItem(name))
  } catch (e) {
    return null
  }
}

export function writeStorage(name, value) {
  try {
    window.localStorage.setItem(name, JSON.stringify(value))
  } catch (e) {
    // The storage is blocked or full - the configurator just won't remember its state
  }
}
