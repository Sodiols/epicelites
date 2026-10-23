"use client";

import Link from "next/link";
import { EyeIcon, EyeSlashIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { deleteMedia, setMediaPublished } from "@/app/(admin)/EEAUTHOR/(console)/media/actions";
import { reorderMedia } from "@/app/(admin)/EEAUTHOR/(console)/media/actions";
import { ActionButton } from "./confirm";
import { RowMenu } from "./row-menu";
import { SortableList } from "./sortable-list";
import Image from "next/image";
import { Badge } from "./ui";

export function MediaItemActions({ id, label, published }: { id: string; label: string; published: boolean }) {
  return (
    <RowMenu label={`Actions for ${label}`}>
      <Link role="menuitem" href={`/EEAUTHOR/media/${id}`} className="menu-item">
        <PencilSimpleIcon size={16} aria-hidden /> Edit details
      </Link>
      <ActionButton className="menu-item" action={() => setMediaPublished(id, !published)}>
        {published ? <EyeSlashIcon size={16} aria-hidden /> : <EyeIcon size={16} aria-hidden />}
        {published ? "Unpublish" : "Publish"}
      </ActionButton>
      <ActionButton
        className="menu-item danger"
        action={() => deleteMedia(id)}
        confirm={{
          title: "Delete this media item?",
          body: "The library entry and its uploaded file are removed permanently. Images shipped with the site are only removed from the gallery.",
          confirmLabel: "Delete",
          danger: true,
        }}
      >
        <TrashIcon size={16} aria-hidden /> Delete
      </ActionButton>
    </RowMenu>
  );
}

type OrderItem = { id: string; label: string; thumb: string | null; published: boolean; featured: boolean };

export function MediaOrder({ items }: { items: OrderItem[] }) {
  return (
    <SortableList
      items={items}
      onSave={reorderMedia}
      label={(i) => i.label}
      render={(i) => (
        <div className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden bg-carbon">
            {i.thumb && <Image src={i.thumb} alt="" fill sizes="48px" className="object-cover" />}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{i.label}</span>
          {i.featured && <Badge tone="violet">Featured</Badge>}
          {!i.published && <Badge>Draft</Badge>}
        </div>
      )}
    />
  );
}
