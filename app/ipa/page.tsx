"use client";

import Image from "next/image";
import Container from "@/components/layout/Container";
import PageHeader from "@/components/layout/PageHeader";
import IPAChart from "@/components/IPAChart";

export default function IPAPage() {
  return (
    <div className="py-8 pb-24">
      <Container>
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
      </Container>

      <Container>
        <div id="ipa-chart" className="mt-8">
          <IPAChart />
        </div>
      </Container>
    </div>
  );
}
