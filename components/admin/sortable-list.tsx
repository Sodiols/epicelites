"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { ArrowDownIcon, ArrowUpIcon, DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { ActionResult } from "@/lib/auth/admin";
import { useToast } from "./toast";
import { snappy } from "@/lib/motion";

function Row<T extends { id: string }>({
  item,
  index,
  total,
  move,
  render,
  label,
}: {
  item: T;
  index: number;
  total: number;
  move: (from: number, to: number) => void;
  render: (item: T) => React.ReactNode;
  label: (item: T) => string;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="relative flex items-center gap-2 border-b border-line bg-night px-2 py-2"
      whileDrag={{ scale: 1.01, boxShadow: "0 16px 40px rgb(0 0 0 / 0.5)", backgroundColor: "#1d1a27", zIndex: 5 }}
      transition={snappy}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${label(item)}`}
        onPointerDown={(e) => controls.start(e)}
        className="grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center text-smoke hover:text-bone active:cursor-grabbing"
      >
        <DotsSixVerticalIcon size={18} weight="bold" />
      </button>
      <div className="min-w-0 flex-1">{render(item)}</div>
      <div className="flex shrink-0">
        <button type="button" className="a-btn a-btn-ghost a-btn-icon" aria-label={`Move ${label(item)} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
          <ArrowUpIcon size={16} />
        </button>
        <button type="button" className="a-btn a-btn-ghost a-btn-icon" aria-label={`Move ${label(item)} down`} disabled={index === total - 1} onClick={() => move(index, index + 1)}>
          <ArrowDownIcon size={16} />
        </button>
      </div>
    </Reorder.Item>
  );
}

/**
 * Drag-to-reorder list (pointer and touch via the handle, keyboard via the arrow buttons).
 * Nothing is saved until "Save order", so an accidental drag is harmless.
 */
export function SortableList<T extends { id: string }>({
  items: initial,
  onSave,
  render,
  label,
}: {
  items: T[];
  onSave: (ids: string[]) => Promise<ActionResult>;
  render: (item: T) => React.ReactNode;
  label: (item: T) => string;
}) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();
  useEffect(() => setItems(initial), [initial]);

  const changed = items.some((it, i) => it.id !== initial[i]?.id);
  const move = (from: number, to: number) =>
    setItems((list) => {
      const next = [...list];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });

  return (
    <div className="grid gap-3">
      <Reorder.Group axis="y" values={items} onReorder={setItems} className="border-t border-line">
        {items.map((item, i) => (
          <Row key={item.id} item={item} index={i} total={items.length} move={move} render={render} label={label} />
        ))}
      </Reorder.Group>
      <AnimatePresence>
        {changed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={snappy}
            className="flex items-center justify-end gap-2"
          >
            <span className="mr-auto text-xs text-smoke">Order changed, not saved yet.</span>
            <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setItems(initial)} disabled={pending}>
              Undo
            </button>
            <button
              type="button"
              className="a-btn a-btn-primary a-btn-sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await onSave(items.map((i) => i.id));
                  toast(r.ok ? "success" : "error", r.ok ? (r.message ?? "Order saved") : r.message);
                  if (r.ok) router.refresh();
                })
              }
            >
              {pending ? "Saving…" : "Save order"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
