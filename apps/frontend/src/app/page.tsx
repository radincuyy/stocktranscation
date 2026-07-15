import { apiGet, API_URL } from "@/lib/api";

type HealthData = {
  status: string;
  service: string;
  database: string;
  timestamp: string;
};

export default async function Home() {
  let health: HealthData | null = null;
  let error: string | null = null;

  try {
    const res = await apiGet<HealthData>("/health");
    health = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to reach backend";
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            PT Multi Power Aditama
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Stock Transaction Module
          </h1>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-800">Backend health</h2>
          <p className="mt-1 text-xs text-zinc-500">{API_URL}/health</p>

          {health ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-emerald-700">{health.status}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Database</dt>
                <dd className="font-medium text-emerald-700">{health.database}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-500">Service</dt>
                <dd className="font-mono text-xs">{health.service}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-zinc-500">Timestamp</dt>
                <dd className="font-mono text-xs">{health.timestamp}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-amber-700">
              Backend belum terjangkau: {error}. Pastikan Postgres + NestJS
              sudah jalan.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
