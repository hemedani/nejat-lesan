import type { Metadata } from "next";
import { Hero } from "@/components/organisms/Hero";
import { ChartShowcase } from "@/components/organisms/landing/ChartShowcase";
import { MapFeaturePreview } from "@/components/organisms/landing/MapFeaturePreview";
import { PlatformTour } from "@/components/organisms/landing/PlatformTour";
import { MobileAppSection } from "@/components/organisms/landing/MobileAppSection";
import { ImpactStats } from "@/components/organisms/landing/ImpactStats";
import { Testimonials } from "@/components/organisms/landing/Testimonials";
import { FinalCTA } from "@/components/organisms/landing/FinalCTA";

export const metadata: Metadata = {
  title: "مرصاد | سامانه هوشمند مدیریت ترافیک و تحلیل تصادفات",
  description:
    "ثبت گزارش در صحنه، تأیید سازمانی، مدیریت انبار و فرم‌ساز سازمانی — یک زنجیره داده یکپارچه برای ایمنی راه‌ها.",
};

/**
 * Landing page order is the argument the page makes:
 * insight (charts) → geography (map) → the tools behind them (platform tour)
 * → the field app → proof (numbers, testimonials) → the ask.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas">
      <Hero />
      <ChartShowcase />
      <MapFeaturePreview />
      <PlatformTour />
      <MobileAppSection />
      <ImpactStats />
      <Testimonials />
      <FinalCTA />
    </main>
  );
}
