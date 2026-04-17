"use client";

import Image from "next/image";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import IPAChart from "@/components/IPAChart";

export default function IPAPage() {
  return (
    <PageLayout
      hero={
        <PageHeader
          badge="Sound Map"
          title="Hear Every Sound"
          subtitle="Explore the IPA"
          description="Tap into English sounds with clear examples and quick guidance."
          primaryCta={{
            label: "Open Chart",
            onClick: () => document.getElementById('ipa-chart')?.scrollIntoView({ behavior: 'smooth' }),
          }}
          illustration={
            <Image
              src="/illustrations/ipa-chart.svg"
              alt="IPA chart illustration"
              width={566}
              height={340}
              priority
              className="w-[300px] xl:w-[340px] h-auto"
            />
          }
        />
      }
    >
      <div id="ipa-chart">
        <IPAChart />
      </div>
    </PageLayout>
  );
}
