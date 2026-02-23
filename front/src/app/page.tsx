import { Hero } from "@/components/organisms/Hero";
import { AnalyticsShowcase } from "@/components/organisms/landing/AnalyticsShowcase";
import { MapFeaturePreview } from "@/components/organisms/landing/MapFeaturePreview";
import { ImpactStats } from "@/components/organisms/landing/ImpactStats";
import { Testimonials } from "@/components/organisms/landing/Testimonials";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      <Hero />
      <AnalyticsShowcase />
      <MapFeaturePreview />
      <ImpactStats />
      <Testimonials />
    </main>
  );
}
