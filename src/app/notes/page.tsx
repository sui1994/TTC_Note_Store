type Note = {
  id: number;
  title: string;
  summary: string;
  updatedAt: string;
};

const notes: Note[] = [
  {
    id: 1,
    title: "卒業制作の要件整理",
    summary: "機能要件、画面要件、公開までのタスクを3分類で整理。",
    updatedAt: "2026-02-07",
  },
  {
    id: 2,
    title: "EC導線メモ",
    summary: "LPから商品詳細、決済、購入後の導線を簡易フロー化。",
    updatedAt: "2026-02-07",
  },
  {
    id: 3,
    title: "LP改善案",
    summary: "ファーストビューとCTAの配置を改善する候補を記録。",
    updatedAt: "2026-02-07",
  },
];

export default function NotesPage() {
  return (
    <main className="mx-auto mt-14 max-w-4xl px-4 pb-16">
      <h1 className="mb-6 text-3xl font-bold">ノート一覧</h1>
      <div className="grid gap-4">
        {notes.map((note) => (
          <article key={note.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">{note.title}</h2>
            <p className="mt-2 text-slate-600">{note.summary}</p>
            <p className="mt-3 text-sm text-slate-500">更新日: {note.updatedAt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
