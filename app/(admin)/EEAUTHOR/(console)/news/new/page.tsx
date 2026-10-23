import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = { title: "Create news" };

export default async function NewNewsPage() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <PageHeader title="Create news" back={{ href: "/EEAUTHOR/news", label: "News" }} />
      <NewsForm />
    </div>
  );
}
