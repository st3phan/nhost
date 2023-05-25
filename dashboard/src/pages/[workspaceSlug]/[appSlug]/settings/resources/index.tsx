import { Container } from '@/components/layout/Container';
import { ResourcesForm } from '@/components/settings/resources/ResourcesForm';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { UpgradeNotification } from '@/features/projects/common/components/UpgradeNotification';
import { useCurrentWorkspaceAndProject } from '@/features/projects/common/hooks/useCurrentWorkspaceAndProject';
import { ActivityIndicator } from '@/ui/v2/ActivityIndicator';
import type { ReactElement } from 'react';

export default function ResourceSettingsPage() {
  const { currentProject, loading } = useCurrentWorkspaceAndProject();

  if (loading) {
    return <ActivityIndicator delay={1000} label="Loading project..." />;
  }

  if (currentProject?.plan.isFree) {
    return (
      <UpgradeNotification message="Unlock Compute settings by upgrading your project to the Pro plan." />
    );
  }

  return <ResourcesForm />;
}

ResourceSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <SettingsLayout>
      <Container
        className="grid max-w-5xl grid-flow-row gap-8 bg-transparent"
        rootClassName="bg-transparent"
      >
        {page}
      </Container>
    </SettingsLayout>
  );
};
