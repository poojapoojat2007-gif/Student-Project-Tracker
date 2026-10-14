import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export function createDb(filePath = process.env.DB_FILE || 'data/projects.json') {
  const persist = async (projects) => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(projects, null, 2));
  };

  const load = async () => {
    try {
      const text = await readFile(filePath, 'utf8');
      if (!text.trim()) return [];
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error && error.code === 'ENOENT') return [];
      throw error;
    }
  };

  return {
    async list() {
      return load();
    },
    async create(project) {
      const projects = await load();
      const nextId = projects.reduce((max, current) => Math.max(max, Number(current.id) || 0), 0) + 1;
      const row = { id: nextId, ...project };
      const nextProjects = [...projects, row];
      await persist(nextProjects);
      return row;
    },
    async update(id, project) {
      const projects = await load();
      const index = projects.findIndex((current) => Number(current.id) === Number(id));
      if (index < 0) return null;
      const nextProjects = [...projects];
      nextProjects[index] = { id: Number(id), ...project };
      await persist(nextProjects);
      return nextProjects[index];
    },
    async remove(id) {
      const projects = await load();
      const found = projects.some((current) => Number(current.id) === Number(id));
      if (!found) return false;
      const nextProjects = projects.filter((current) => Number(current.id) !== Number(id));
      await persist(nextProjects);
      return true;
    }
  };
}

export const db = createDb();
