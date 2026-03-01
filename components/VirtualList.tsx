"use client";
import { useMemo, useRef, useState } from "react";

export default function VirtualList<T>(props: {
  items: T[];
  itemHeight: number; // px
  height: number; // px
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const { items, itemHeight, height, renderItem } = props;
  const overscan = props.overscan ?? 6;
  const ref = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const total = items.length * itemHeight;

  const range = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + overscan);
    return { start, end };
  }, [scrollTop, itemHeight, height, overscan, items.length]);

  return (
    <div
      ref={ref}
      style={{ height, overflow: "auto" }}
      className="rounded-3xl border border-zinc-800 bg-zinc-950/30"
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: total, position: "relative" }}>
        {items.slice(range.start, range.end).map((item, i) => {
          const idx = range.start + i;
          return (
            <div key={idx} style={{ position: "absolute", top: idx * itemHeight, left: 0, right: 0, height: itemHeight }}>
              {renderItem(item, idx)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
