'use server';

import { redirect } from 'next/navigation';

/** Echoes the submitted `date` field back to the page through the URL. */
export async function submitDate(formData: FormData): Promise<never> {
  const date = formData.get('date');
  redirect(`/form?date=${encodeURIComponent(typeof date === 'string' ? date : '')}`);
}
