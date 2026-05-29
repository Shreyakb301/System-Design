import { SidebarLayout } from "@/components/layout/SidebarLayout";

export default function SystemDesignLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SidebarLayout sectionId="system-design">{children}</SidebarLayout>;
}
