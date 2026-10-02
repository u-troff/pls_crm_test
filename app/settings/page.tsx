import { PageHeader } from "@/components/layout/page-header";
import { getBusinessConfig } from "@/lib/business-config";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const config = await getBusinessConfig();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business profile and branding."
      />
      <div className="p-8">
        <SettingsForm config={config} />
      </div>
    </div>
  );
}
