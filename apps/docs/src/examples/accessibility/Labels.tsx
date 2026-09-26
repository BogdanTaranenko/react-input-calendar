import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function Labels() {
  return (
    <DatePicker
      label="Fecha de llegada"
      locale="es-ES"
      // Intl already translates the dates; these are the few strings it cannot provide.
      labels={{
        openCalendar: 'Abrir calendario',
        clear: 'Borrar',
        previousMonth: 'Mes anterior',
        nextMonth: 'Mes siguiente',
        chooseMonth: 'Elegir mes',
        calendarDialog: 'Elegir fecha',
        unavailable: 'no disponible',
      }}
    />
  );
}
