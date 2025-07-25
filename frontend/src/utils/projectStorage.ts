const KEY = 'selectedProjectKey';

export const saveProject = (k: string) => localStorage.setItem(KEY, k);
export const loadProject = () => localStorage.getItem(KEY);
export const clearProject = () => localStorage.removeItem(KEY);