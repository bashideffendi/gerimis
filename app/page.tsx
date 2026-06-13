import MapShell from "@/components/MapShell";

export default function Home() {
  return (
    <main className="flex h-dvh w-full flex-col bg-[#0b1220]">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="text-xl leading-none">
            🌧️
          </span>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight">Gerimis</h1>
            <p className="text-[11px] text-white/55">Radar hujan Batam &amp; sekitarnya</p>
          </div>
        </div>
        <a
          href="https://www.weather.gov.sg/weather-rain-area-240km"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
        >
          data: weather.gov.sg
        </a>
      </header>

      <div className="relative min-h-0 flex-1">
        <MapShell />
      </div>
    </main>
  );
}
