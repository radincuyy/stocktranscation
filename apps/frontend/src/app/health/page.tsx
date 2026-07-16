import { apiGet, API_URL } from "@/lib/api";

type HealthData = {
  status: string;
  service: string;
  database: string;
  timestamp: string;
};

export default async function HealthPage() {
  let health: HealthData | null = null;
  let error: string | null = null;

  try {
    const res = await apiGet<HealthData>("/health");
    health = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to reach backend";
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">System health</h1>
        <p className="mt-2 text-muted">
          Endpoint backend:{" "}
          <code className="font-mono text-sm text-foreground">
            {API_URL}/health
          </code>
        </p>
      </div>

      <section className="rounded-[var(--radius-app)] border border-border bg-surface p-5">
        {health ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1 font-medium text-accent">{health.status}</dd>
            </div>
            <div>
              <dt className="text-muted">Database</dt>
              <dd className="mt-1 font-medium text-accent">{health.database}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Service</dt>
              <dd className="mt-1 font-mono text-xs">{health.service}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Timestamp</dt>
              <dd className="mt-1 font-mono text-xs">{health.timestamp}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-warning">
            Backend belum terjangkau: {error}. Pastikan Postgres dan NestJS
            sudah jalan.
          </p>
        )}
      </section>
    </div>
  );
}
