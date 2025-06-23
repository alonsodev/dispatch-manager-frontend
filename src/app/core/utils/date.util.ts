import { format, parseISO, isValid } from 'date-fns';

/**
 * Utilidades para manejo de fechas
 */
export class DateUtil {
  
  /**
   * Formatea fecha para mostrar en la UI
   */
  static formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      
      if (!isValid(dateObj)) {
        return 'Fecha inválida';
      }
      
      return format(dateObj, formatStr);
    } catch {
      return 'Fecha inválida';
    }
  }

  /**
   * Formatea fecha y hora
   */
  static formatDateTime(date: string | Date): string {
    return this.formatDate(date, 'dd/MM/yyyy HH:mm');
  }

  /**
   * Obtiene fecha actual en formato ISO
   */
  static getCurrentISODate(): string {
    return new Date().toISOString();
  }

  /**
   * Convierte fecha a formato para input
   */
  static toInputFormat(date: string | Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      
      if (!isValid(dateObj)) {
        return '';
      }
      
      return format(dateObj, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }

  /**
   * Calcula tiempo transcurrido de forma amigable
   */
  static getTimeAgo(date: string | Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return 'hace un momento';
      if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      
      return this.formatDate(dateObj);
    } catch {
      return 'fecha inválida';
    }
  }
}