"use client";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export function OrderSummary({
  subtotal,
  shipping,
  onProceedCheckout,
}: {
  subtotal: number;
  shipping: number;
  onProceedCheckout: () => void;
}) {
  const total = subtotal + shipping;
  return (
    <aside className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)]">
      <h3 className="text-xl font-semibold text-[#0a0a0a]">注文サマリー</h3>
      <div className="mt-4 space-y-2 text-sm text-[#4a5565]">
        <div className="flex justify-between">
          <span>小計</span>
          <span>{yen(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>送料</span>
          <span>{yen(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-[#f0e7dc] pt-3 text-base font-semibold text-[#0a0a0a]">
          <span>合計</span>
          <span>{yen(total)}</span>
        </div>
      </div>
      <button
        className="mt-6 w-full rounded-full bg-gradient-to-r from-[#ff8904] via-[#fb64b6] to-[#8ec5ff] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onProceedCheckout}
        disabled={subtotal <= 0}
        type="button"
      >
        購入に進む（ダミー）
      </button>
    </aside>
  );
}

