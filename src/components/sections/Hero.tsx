export default function Hero() {
  return (
    <section className="relative h-[420px] w-full bg-surface">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCdBiNNOX1i01jTzdrpduflWg_aMi6LZJme8rPw7oeINf5F2VTl-x8Fm0JpjTiPqLNoAo_hFZ5r0IU6GGttPoRZcbJSpg9EWfh8aD5ONyZYzB0bjW9r8GbBj8_5GzpQNwdXwen9yo2EJpMnDtCPiLOvllxe03A1LOk85ezfezMmWRPZVKZwNmfRKiUYhqMqtN91GfBhsDsRn0f3mAj6xS1tImfjKogTOuFVYdmsfLQ3e1bkBC1iUuOYezJ4E5K2GwVxpIF_jprGCgJl')",
        }}
      >
        <div className="absolute inset-0 bg-text-main/40" />
      </div>
      <div className="relative h-full flex flex-col items-center justify-center px-6 pb-12 text-center">
        <h1 className="font-display font-bold text-[32px] leading-tight text-white max-w-[320px]">
          Reserve a sua próxima estadia em Cascais
        </h1>
      </div>
    </section>
  );
}
