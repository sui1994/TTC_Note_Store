import { BrandFooter } from "./components/BrandFooter";
import { StoreCartProvider } from "./components/StoreCartContext";
import { StoreHeader } from "./components/StoreHeader";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoreCartProvider>
      <main className="min-h-screen bg-gradient-to-b from-[#fff7ed] via-[#fefce8] to-[#eff6ff]">
        <section className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
          <StoreHeader />
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 pb-4 md:px-8">{children}</section>
        <section className="mx-auto w-full max-w-6xl px-4 pb-10 md:px-8">
          <BrandFooter />
        </section>
      </main>
    </StoreCartProvider>
  );
}
