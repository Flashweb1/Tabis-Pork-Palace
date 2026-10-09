export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="prose-tp">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h2 key={i}>{b.slice(3)}</h2>
        ) : b.includes("\n## ") ? (
          <div key={i}>
            {b.split("\n").map((l, j) => (l.startsWith("## ") ? <h2 key={j}>{l.slice(3)}</h2> : <p key={j}>{l}</p>))}
          </div>
        ) : (
          <p key={i}>{b}</p>
        ),
      )}
    </div>
  );
}
