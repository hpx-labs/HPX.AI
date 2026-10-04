export const DEFAULT_SETTINGS = {
  theme: "dark",
  accent: "cyan",
  fontSize: "medium",
  compactMode: false,
  sound: true,
  voiceInput: true,
  autoSave: true
};

export function createSettings(saved = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...saved
  };
}

export function updateSetting(settings, key, value) {
  return {
    ...settings,
    [key]: value
  };
}

export function resetSettings() {
  return { ...DEFAULT_SETTINGS };
}
