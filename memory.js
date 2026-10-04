export function createMemory() {
  return {
    facts: [],
    preferences: [],
    notes: [],
    updatedAt: Date.now()
  };
}

export function addMemory(memory, type, text) {
  if (!text) return memory;

  if (!memory[type]) {
    memory[type] = [];
  }

  if (!memory[type].includes(text)) {
    memory[type].push(text);
  }

  memory.updatedAt = Date.now();

  return memory;
}

export function removeMemory(memory, type, text) {
  if (!memory[type]) return memory;

  memory[type] = memory[type].filter(item => item !== text);
  memory.updatedAt = Date.now();

  return memory;
}

export function clearMemory() {
  return createMemory();
}
