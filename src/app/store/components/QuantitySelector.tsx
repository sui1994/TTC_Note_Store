"use client";

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="inline-flex items-center rounded-full border border-[#e6ddd0] bg-white p-1">
      <button className="h-8 w-8 rounded-full text-[#364153] hover:bg-[#fff7ed]" onClick={dec} type="button">
        -
      </button>
      <span className="w-10 text-center text-sm text-[#0a0a0a]">{value}</span>
      <button className="h-8 w-8 rounded-full text-[#364153] hover:bg-[#fff7ed]" onClick={inc} type="button">
        +
      </button>
    </div>
  );
}

