import IPAChart from "@/components/ipa/IPAChart";
import PageLayout from "@/components/layout/PageLayout";

export default function IPAPage() {
  return (
    <div className="ipa-chart">
      <PageLayout>
        <IPAChart />
      </PageLayout>
    </div>
  );
}
