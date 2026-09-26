import {
  CalendarConfigProvider,
  DateRangePicker,
  type CalendarLabels,
} from '@b.taranenko/react-input-calendar';

// Every string Intl cannot provide, in Canadian French.
const frenchLabels: CalendarLabels = {
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  previousYears: 'Années précédentes',
  nextYears: 'Années suivantes',
  chooseMonth: 'Choisir le mois',
  chooseYear: "Choisir l'année",
  openCalendar: 'Ouvrir le calendrier',
  clear: 'Effacer',
  done: 'Terminé',
  close: 'Fermer',
  selectedDates: (count) => `${String(count)} dates`,
  hours: 'Heures',
  minutes: 'Minutes',
  dayPeriod: 'AM/PM',
  calendarDialog: 'Choisir une date',
  rangeStart: 'début de la période',
  rangeEnd: 'fin de la période',
  unavailable: 'indisponible',
  presets: 'Raccourcis',
};

export default function TranslatedLabels() {
  return (
    <CalendarConfigProvider locale="fr-CA" labels={frenchLabels}>
      <DateRangePicker label="Séjour" />
    </CalendarConfigProvider>
  );
}
