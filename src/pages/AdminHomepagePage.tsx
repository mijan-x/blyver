import { useEffect, useState } from "react";
import type { FormEvent as FormEventType } from "react";
import {
  defaultHomepageContent,
  getHomepageContent,
  saveHomepageContent,
  type HomepageContent,
} from "../services/contentService";
import AdminToast from "../components/admin/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";
const fields: Array<[keyof HomepageContent, string]> = [
  ["heroEyebrow", "Hero eyebrow"],
  ["heroTitle", "Hero title"],
  ["heroDescription", "Hero description"],
  ["editTitle", "Blyver Edit title"],
  ["editDescription", "Blyver Edit description"],
  ["newsletterTitle", "Newsletter title"],
  ["newsletterDescription", "Newsletter description"],
];
function AdminHomepagePage() {
  const [content, setContent] = useState<HomepageContent>(
    defaultHomepageContent,
  );
  const { toast, notifySuccess, notifyError, dismiss } = useAdminToast();
  const [loadNote, setLoadNote] = useState("");
  useEffect(() => {
    getHomepageContent()
      .then(setContent)
      .catch(() =>
        setLoadNote("Using default content until the CMS migration is run."),
      );
  }, []);
  async function submit(event: FormEventType<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await saveHomepageContent(content);
    if (error) notifyError(error.message);
    else notifySuccess("Homepage content saved.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return (
    <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-20">
      <AdminToast toast={toast} onDismiss={dismiss} />
      <form onSubmit={submit} className="mx-auto max-w-3xl">
        <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
          BLYVER ADMIN / HOMEPAGE
        </p>
        <h1 className="mt-5 font-serif text-5xl">Homepage content.</h1>
        {loadNote && (
          <p className="mt-4 text-sm text-blyver-charcoal/65">{loadNote}</p>
        )}
        <div className="mt-10 space-y-5">
          {fields.map(([key, label]) => (
            <label key={key} className="block text-sm">
              {label}
              <textarea
                value={content[key]}
                onChange={(event) =>
                  setContent({ ...content, [key]: event.target.value })
                }
                rows={key.includes("Description") ? 3 : 1}
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-4 py-3"
              />
            </label>
          ))}
        </div>
        <button className="mt-8 bg-blyver-ink px-6 py-4 text-[11px] tracking-[0.16em] text-blyver-ivory">
          SAVE HOMEPAGE
        </button>
      </form>
    </main>
  );
}
export default AdminHomepagePage;
