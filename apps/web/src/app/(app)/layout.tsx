import Header from "@/components/header";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr] bg-background text-foreground">
      <Header />
      {children}
    </div>
  );
}
