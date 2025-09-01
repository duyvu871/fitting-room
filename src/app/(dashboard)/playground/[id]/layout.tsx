import PlaygroundProvider from 'app/providers/playground-provider';
import { AutosaveProvider } from 'app/providers/autosave';

interface PlaygroundLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function PlaygroundLayout({ children, params }: PlaygroundLayoutProps) {
  const { id } = await params;
  return (
    <PlaygroundProvider id={id}>
      <AutosaveProvider>{children}</AutosaveProvider>
    </PlaygroundProvider>
  );
}
