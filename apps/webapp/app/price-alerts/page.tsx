import PriceAlertsPanel from '@/components/price-alerts-panel';
import { PriceAlertsProvider } from '@/hooks/use-price-alerts';

export default function PriceAlertsPage() {
  return (
    <main className="min-h-screen px-4 py-24 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-white mb-4">Price Alerts</h1>
        <PriceAlertsProvider>
          <PriceAlertsPanel />
        </PriceAlertsProvider>
      </div>
    </main>
  );
}
