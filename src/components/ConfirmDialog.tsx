"use client";

import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open,
  title,
  children,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      className="rounded-2xl p-0 backdrop:bg-black/40 max-w-md w-full"
    >
      <div className="p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-stone-800">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
