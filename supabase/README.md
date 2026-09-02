# Supabase catalogue setup

1. Sign in to [Supabase](https://supabase.com/dashboard) and open the Blyver project.
2. In the left sidebar, select **SQL Editor**.
3. Select **New query**.
4. Open `supabase/migrations/20260901120000_create_catalog.sql` in VS Code, copy all of it, and paste it into the query editor.
5. Click **Run**.
6. In Supabase, open **Table Editor**. Confirm that `categories`, `collections`, `products`, `product_images`, `product_variants`, and `product_specifications` exist.
7. Open **Storage** and confirm the public `product-images` bucket exists.

The migration enables Row Level Security. Visitors can read active catalogue data, while changes are restricted to an authenticated user with the `admin` role. Do not edit product prices, stock, or role data from the website client.

## Customer authentication setup

Run `supabase/migrations/20260901123000_create_profiles.sql` once in **SQL Editor**. Then open **Authentication** → **URL Configuration**, set **Site URL** to `http://localhost:5173`, and add `http://localhost:5173/account` and `http://localhost:5173/update-password` as Redirect URLs.

## Wishlist setup

Run `supabase/migrations/20260901130000_create_wishlists.sql` once in **SQL Editor**. Each customer can read and change only their own wishlist.

When authentication is added in Step 6, make your own account an administrator with this one-time SQL command, replacing the email address:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.user_role
from auth.users
where email = 'your-email@example.com'
on conflict (user_id) do update set role = excluded.role;
```

After running that command, sign out and sign back in. Your protected admin dashboard will be available at `/admin`.

## Homepage CMS setup

Run `supabase/migrations/20260901170000_create_homepage_content.sql` once in **SQL Editor**. As an admin, edit the saved homepage copy at `/admin/homepage`.

## Bangladesh store settings

Run `supabase/migrations/20260901180000_add_bangladesh_settings.sql` once in **SQL Editor`. As an admin, manage delivery charges, free delivery threshold, BDT, and customer-care details at `/admin/settings`.
