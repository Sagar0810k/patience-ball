import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="menu" id="main" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <h1 aria-label="Page not found"><span>Off</span><em>the</em><span>board</span></h1>
      <p className="tagline">That page does not exist. The game is one tap away.</p>
      <div className="menu-actions"><Link className="btn primary" href="/">Back to the game</Link></div>
    </main>
  );
}
