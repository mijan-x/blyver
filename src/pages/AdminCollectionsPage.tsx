import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  deleteAdminCollection,
  getAdminCollections,
  saveAdminCollection,
  uploadAdminCollectionImage,
  type AdminCollection,
  type CollectionInput,
} from "../services/adminCollectionsService";
import { supabase } from "../lib/supabase";
import AdminToast from "../components/admin/AdminToast";
import { useAdminToast } from "../hooks/useAdminToast";

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const emptyCollection = (position: number): CollectionInput => ({
  name: "",
  description: "",
  link_path: "",
  position,
  active: true,
});

function imageUrl(path: string | null) {
  return path
    ? supabase.storage.from("product-images").getPublicUrl(path).data
        .publicUrl
    : null;
}

function AdminCollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [editing, setEditing] = useState<AdminCollection | null>(null);
  const [form, setForm] = useState<CollectionInput>(emptyCollection(1));
  const [image, setImage] = useState<File | null>(null);
  const { toast, notifySuccess, notifyError, dismiss } = useAdminToast();

  const load = useCallback(
    () =>
      getAdminCollections()
        .then(setCollections)
        .catch((error: Error) => notifyError(error.message)),
    [notifyError],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const change = <K extends keyof CollectionInput>(
    key: K,
    value: CollectionInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  function startNew() {
    setEditing(null);
    setImage(null);
    setForm(emptyCollection(collections.length + 1));
    scrollToTop();
  }
  function startEdit(collection: AdminCollection) {
    setEditing(collection);
    setImage(null);
    setForm({
      name: collection.name,
      description: collection.description,
      link_path: collection.link_path ?? "",
      position: collection.position,
      active: collection.active,
    });
    // The collection list this is called from can be far below the form
    // on narrower screens, so scroll up to where the form just changed.
    scrollToTop();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const id = await saveAdminCollection(form, editing?.id);
      if (image) await uploadAdminCollectionImage(id, form.name, image);
      notifySuccess(editing ? "Collection updated." : "Collection added.");
      startNew();
      await load();
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : "Collection could not be saved.",
      );
    }
  }

  async function remove(collection: AdminCollection) {
    if (
      !window.confirm(`Remove ${collection.name}? This cannot be undone.`)
    )
      return;
    try {
      await deleteAdminCollection(collection);
      notifySuccess("Collection removed.");
      await load();
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : "Collection could not be removed.",
      );
    }
  }

  return (
    <main className="bg-blyver-ivory px-6 py-16 text-blyver-ink sm:px-10 sm:py-20">
      <AdminToast toast={toast} onDismiss={dismiss} />
      <div className="mx-auto grid max-w-7xl gap-14 xl:grid-cols-[420px_1fr]">
        <section>
          <p className="text-[11px] tracking-[0.24em] text-blyver-champagne">
            BLYVER ADMIN / COLLECTIONS
          </p>
          <h1 className="mt-5 font-serif text-5xl">
            {editing ? "Edit collection." : "Add a collection."}
          </h1>
          <p className="mt-4 text-sm leading-7 text-blyver-charcoal/65">
            Controls what shows on the public /collections page -- name,
            description, feature image, display order, and whether it's
            visible.
          </p>
          <form onSubmit={submit} className="mt-9 space-y-4">
            <label className="block text-sm">
              Collection name
              <input
                required
                value={form.name}
                onChange={(event) => change("name", event.target.value)}
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(event) =>
                  change("description", event.target.value)
                }
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              />
            </label>
            <label className="block text-sm">
              "Discover" link (e.g. /men, /women, /collections)
              <input
                value={form.link_path ?? ""}
                onChange={(event) => change("link_path", event.target.value)}
                placeholder="/collections"
                className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                Display order
                <input
                  required
                  min="0"
                  type="number"
                  value={form.position}
                  onChange={(event) =>
                    change("position", Number(event.target.value))
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                />
              </label>
              <label className="text-sm">
                Visibility
                <select
                  value={form.active ? "active" : "inactive"}
                  onChange={(event) =>
                    change("active", event.target.value === "active")
                  }
                  className="mt-2 w-full border border-blyver-ink/20 bg-transparent px-3 py-3"
                >
                  <option value="active">Visible</option>
                  <option value="inactive">Hidden</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">
              Feature image
              <input
                accept="image/*"
                type="file"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm"
              />
            </label>
            {editing?.image_path && (
              <img
                src={imageUrl(editing.image_path) ?? undefined}
                alt=""
                className="h-32 w-full max-w-xs object-cover"
              />
            )}
            <div className="flex gap-4">
              <button className="bg-blyver-ink px-5 py-4 text-[11px] tracking-[0.15em] text-blyver-ivory">
                {editing ? "SAVE CHANGES" : "ADD COLLECTION"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={startNew}
                  className="border border-blyver-ink/25 px-5 py-4 text-[11px] tracking-[0.15em]"
                >
                  CANCEL
                </button>
              )}
            </div>
          </form>
        </section>
        <section>
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-blyver-champagne">
                COLLECTIONS
              </p>
              <h2 className="mt-3 font-serif text-4xl">
                Shown on /collections.
              </h2>
            </div>
            <button
              type="button"
              onClick={startNew}
              className="text-[11px] tracking-[0.14em] underline"
            >
              NEW COLLECTION
            </button>
          </div>
          <div className="mt-8 divide-y divide-blyver-ink/10 border-y border-blyver-ink/10">
            {collections.map((collection) => (
              <article
                key={collection.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div className="flex items-center gap-4">
                  {imageUrl(collection.image_path) && (
                    <img
                      src={imageUrl(collection.image_path) ?? undefined}
                      alt=""
                      className="h-14 w-14 object-cover"
                    />
                  )}
                  <div>
                    <p className="font-serif text-xl">{collection.name}</p>
                    <p className="mt-1 text-xs text-blyver-muted">
                      #{collection.position} ·{" "}
                      {collection.active ? "visible" : "hidden"} ·{" "}
                      {collection.link_path || "no link set"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-[11px] tracking-[0.13em]">
                  <button
                    onClick={() => startEdit(collection)}
                    className="underline"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => remove(collection)}
                    className="text-red-800 underline"
                  >
                    REMOVE
                  </button>
                </div>
              </article>
            ))}
            {!collections.length && (
              <p className="py-10 text-sm text-blyver-muted">
                No collections yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminCollectionsPage;
