"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || "Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
