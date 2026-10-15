import { supabase } from "../lib/supabase";

export type AdminCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_path: string | null;
  link_path: string | null;
  position: number;
  active: boolean;
};

export type CollectionInput = Omit<AdminCollection, "id" | "slug" | "image_path">;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getAdminCollections() {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, slug, description, image_path, link_path, position, active")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminCollection[];
}

export async function saveAdminCollection(input: CollectionInput, id?: string) {
  const payload = { ...input, slug: slugify(input.name) };
  const response = id
    ? await supabase
        .from("collections")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("collections").insert(payload).select("id").single();
  if (response.error) throw response.error;
  return response.data.id as string;
}

export async function deleteAdminCollection(collection: AdminCollection) {
  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collection.id);
  if (error) throw error;
  if (collection.image_path)
    await supabase.storage
      .from("product-images")
      .remove([collection.image_path]);
}

export async function uploadAdminCollectionImage(
  collectionId: string,
  collectionName: string,
  file: File,
) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `collections/${slugify(collectionName)}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: existing } = await supabase
    .from("collections")
    .select("image_path")
    .eq("id", collectionId)
    .maybeSingle();

  const { error } = await supabase
    .from("collections")
    .update({ image_path: path })
    .eq("id", collectionId);
  if (error) throw error;

  if (existing?.image_path && existing.image_path !== path)
    await supabase.storage.from("product-images").remove([existing.image_path]);
}
