import type { DailyNote } from './types';
import { supabase } from '../../shared/lib/supabaseClient';

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

  /**
   * Sincroniza notas diarias a la nube
   */
  async syncToCloud(notes?: Record<string, DailyNote>): Promise<void> {
    try {
      const payload = notes || this.getAllNotes();
      await supabase.from('tasks').upsert({
        id: 'sys-daily-notes',
        title: '__DAILY_NOTES_CLOUD__',
        description: JSON.stringify(payload),
        due_date: '2099-12-31',
        priority: 'low',
        is_completed: true,
      });
    } catch (err) {
      console.warn('Error sincronizando notas con la nube:', err);
    }
  },

  /**
   * Descarga notas diarias de la nube
   */
  async fetchFromCloud(): Promise<Record<string, DailyNote>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('description')
        .eq('id', 'sys-daily-notes');

      if (!error && data && data.length > 0 && data[0]?.description) {
        const cloudNotes = JSON.parse(data[0].description);
        if (cloudNotes && typeof cloudNotes === 'object') {
          const keys = Object.keys(cloudNotes);
          if (keys.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudNotes));
            return cloudNotes;
          } else {
            const local = this.getAllNotes();
            if (Object.keys(local).length > 0) {
              await this.syncToCloud(local);
            }
          }
        }
      } else {
        const local = this.getAllNotes();
        if (Object.keys(local).length > 0) {
          await this.syncToCloud(local);
        }
      }
    } catch (err) {
      console.warn('Error trayendo notas de la nube:', err);
    }
    return this.getAllNotes();
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
      this.syncToCloud(notes);
    } catch (e) {
      console.error('Error guardando nota diaria:', e);
    }
  },

  deleteNote(date: string): void {
    try {
      const notes = this.getAllNotes();
      delete notes[date];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      this.syncToCloud(notes);
    } catch (e) {
      console.error('Error eliminando nota diaria:', e);
    }
  },
};
