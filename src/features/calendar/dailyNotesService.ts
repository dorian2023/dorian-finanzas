import type { DailyNote } from './types';

const STORAGE_KEY = 'dorian_daily_notes';

export const DailyNotesService = {
  getAllNotes(): Record<string, DailyNote> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error cargando notas diarias:', e);
      return {};
    }
  },

  getNote(date: string): string {
    const notes = this.getAllNotes();
    return notes[date]?.content || '';
  },

  saveNote(date: string, content: string): void {
    try {
      const notes = this.getAllNotes();
      if (!content.trim()) {
        delete notes[date];
      } else {
        notes[date] = {
          date,
          content: content.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Error guardando nota diaria:', e);
    }
  },

  deleteNote(date: string): void {
    try {
      const notes = this.getAllNotes();
      delete notes[date];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Error eliminando nota diaria:', e);
    }
  },
};
