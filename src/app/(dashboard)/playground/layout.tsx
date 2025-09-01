import { ReactNode } from 'react';
// import { requireAuth } from 'app/lib/auth-helpers';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function PlaygroundPageLayout({ children }: DashboardLayoutProps) {
  // Require authentication for dashboard routes
  // await requireAuth();

  return <>{children}</>;
}
