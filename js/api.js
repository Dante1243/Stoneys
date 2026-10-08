/* Data layer for quote and fleet requests.
   Stage 1: not connected to anything. Submissions are only logged.
   Stage 2 replaces these with Supabase inserts (and photo uploads to private storage),
   then flips FORMS_LIVE to true. */

export const FORMS_LIVE = false;

const fakeDelay = () => new Promise((r) => setTimeout(r, 700));

export async function submitQuote(data, photos) {
  console.info('[preview] quote request', data, `${photos.length} photo(s)`);
  await fakeDelay();
  return { ok: true };
}

export async function submitFleetQuote(data) {
  console.info('[preview] fleet quote request', data);
  await fakeDelay();
  return { ok: true };
}
