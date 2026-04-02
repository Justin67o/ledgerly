'use client';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export function DeleteConfirmation({ isOpen, onCancel, onConfirm, itemName }: DeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
    >
      <div
        className="rounded-2xl p-6 w-80 shadow-2xl text-center"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          Confirm deletion
        </p>
        <p className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
          {`Delete ${itemName || "this item"}?`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
          >
            Cancel
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ backgroundColor: "var(--negative)", color: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#d93030")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--negative)")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
