import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DatePicker, DateRangePicker, type DateRange } from '@b.taranenko/react-input-calendar';

interface TripForm {
  departure: Date | null;
  stay: DateRange | null;
}

export default function HookForm() {
  const [saved, setSaved] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<TripForm>({
    defaultValues: { departure: null, stay: null },
  });

  const onSubmit = (data: TripForm) => {
    setSaved(JSON.stringify(data));
  };

  return (
    <form className="demo-stack" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <Controller
        name="departure"
        control={control}
        rules={{ required: 'Pick a departure day.' }}
        render={({ field, fieldState }) => (
          <DatePicker
            label="Departure"
            value={field.value}
            onChange={field.onChange}
            onOpenChange={(open) => {
              if (!open) field.onBlur();
            }}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        name="stay"
        control={control}
        rules={{ validate: (range) => range?.to != null || 'Pick the last day too.' }}
        render={({ field, fieldState }) => (
          <DateRangePicker
            label="Stay"
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <button type="submit" className="demo-button" disabled={formState.isSubmitting}>
        Save
      </button>
      {saved && <p className="demo-output">Saved: {saved}</p>}
    </form>
  );
}
