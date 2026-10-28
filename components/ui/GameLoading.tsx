export default function GameLoading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden><i /><i /><i /></div>
      <p>Setting up the board…</p>
    </div>
  );
}
