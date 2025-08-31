import PlaygroundProvider from 'app/providers/playground-provider';

interface PlaygroundLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function PlaygroundLayout({ children, params }: PlaygroundLayoutProps) {
  const { id } = await params;
  return <PlaygroundProvider id={id}>{children}</PlaygroundProvider>;
}
