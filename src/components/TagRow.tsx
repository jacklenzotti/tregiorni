export function TagRow({
  tags,
  selected,
  onToggle,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <button
          key={tag}
          className={selected.includes(tag) ? 'chip active' : 'chip'}
          onClick={() => onToggle(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
