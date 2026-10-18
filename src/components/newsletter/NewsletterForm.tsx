import { useState } from "react";
import type { FormEvent } from "react";
import { joinNewsletter } from "../../services/newsletterService";

function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    setStatus("saving");
    setError("");
    try {
      await joinNewsletter(email);
      setStatus("done");
    } catch (joinError) {
      setStatus("idle");
      setError(
        joinError instanceof Error &&
          joinError.message.startsWith("Please enter")
          ? joinError.message
          : "We could not add you to the list right now. Please try again.",
      );
    }
  }

  if (status === "done")
    return (
      <p role="status" className="mt-9 text-sm text-blyver-ivory">
        Thank you. You are on the Blyver list.
      </p>
    );

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
    >
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Your email address"
        className="w-full border border-blyver-ivory/40 bg-transparent px-4 py-4 text-sm text-blyver-ivory outline-none placeholder:text-blyver-muted focus:border-blyver-champagne"
      />
      <button
        disabled={status === "saving"}
        className="border border-blyver-ivory/50 px-7 py-4 text-[11px] tracking-[0.18em] transition hover:border-blyver-champagne hover:text-blyver-champagne disabled:opacity-60"
      >
        {status === "saving" ? "JOINING…" : "JOIN THE LIST"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-300 sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}

export default NewsletterForm;
