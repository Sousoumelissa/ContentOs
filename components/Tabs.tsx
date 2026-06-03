export type TabItem = {
  key: string;
  label: string;
  count?: number;
};

export function Tabs({
  items,
  active,
  setActive
}: {
  items: TabItem[];
  active: string;
  setActive: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setActive(item.key)}
          className={`h-10 rounded-2xl px-4 text-sm font-black ${
            active === item.key ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
          }`}
        >
          {item.label}
          {item.count !== undefined ? <span className="ml-1 opacity-70">({item.count})</span> : null}
        </button>
      ))}
    </div>
  );
}
