import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { deleteBlogPost, saveBlogPost } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { dateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Blog & content" };

const CATS = ["Recipes", "Cooking Tips", "Pork Cuts Guide", "Farm Updates"];

export default async function AdminBlog({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin("blog");
  const { edit } = await searchParams;
  const list = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  const p = edit === "new" ? undefined : edit ? (await db.select().from(blogPosts).where(eq(blogPosts.id, Number(edit))).limit(1))[0] : undefined;
  const showForm = edit === "new" || !!p;
  const i = "input !py-2";
  return (
    <div>
      <AdminHeader title="Blog & content" sub="Recipes, cooking tips, cuts guides and farm updates. Use “## Heading” lines for subheadings; separate paragraphs with a blank line." actions={!showForm ? <Link href="/admin/blog?edit=new" className="btn-primary btn-sm">New post</Link> : undefined} />
      {showForm && (
        <Panel title={p ? "Edit post" : "New post"} className="mb-6">
          <form action={saveBlogPost} key={p?.id ?? "new"} className="grid gap-4 p-5 sm:grid-cols-2">
            {p && <input type="hidden" name="id" value={p.id} />}
            <F label="Title"><input name="title" required defaultValue={p?.title} className={i} /></F>
            <F label="Category"><select name="category" defaultValue={p?.category ?? "Recipes"} className={i}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></F>
            <F label="Slug"><input name="slug" defaultValue={p?.slug} placeholder="auto from title" className={i} /></F>
            <F label="Image URL"><input name="image" defaultValue={p?.image} className={i} /></F>
            <F label="Excerpt" className="sm:col-span-2"><textarea name="excerpt" rows={2} defaultValue={p?.excerpt} className={i} /></F>
            <F label="Content" className="sm:col-span-2"><textarea name="content" rows={12} defaultValue={p?.content} className={i} /></F>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p?.published ?? true} className="h-4 w-4 accent-[#123D27]" /> Published</label>
            <div className="flex items-end justify-end gap-2"><Link href="/admin/blog" className="btn-outline btn-sm">Cancel</Link><button className="btn-primary btn-sm">Save post</button></div>
          </form>
        </Panel>
      )}
      <Panel>
        <ul className="divide-y divide-forest/10">
          {list.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div><p className="font-semibold text-forest">{x.title}</p><p className="text-xs text-charcoal/50">{x.category} · {dateShort(x.publishedAt)} · {x.published ? "Published" : "Draft"}</p></div>
              <div className="flex gap-4 text-sm font-semibold"><Link href={`/blog/${x.slug}`} className="text-charcoal/60 hover:underline">View</Link><Link href={`/admin/blog?edit=${x.id}`} className="text-forest hover:underline">Edit</Link><form action={deleteBlogPost}><input type="hidden" name="id" value={x.id} /><button className="text-red-600 hover:underline">Delete</button></form></div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
