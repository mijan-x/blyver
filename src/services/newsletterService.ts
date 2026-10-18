import { supabase } from "../lib/supabase";

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeNewsletterEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string) {
  return email.length <= 254 && emailPattern.test(email);
}

// Adds an email to the list. A repeat sign-up is ignored by the database
// (on conflict do nothing), so it succeeds without revealing whether the
// address was already subscribed.
export async function joinNewsletter(rawEmail: string) {
  const email = normalizeNewsletterEmail(rawEmail);
  if (!isValidNewsletterEmail(email))
    throw new Error("Please enter a valid email address.");
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  if (error) throw error;
}
