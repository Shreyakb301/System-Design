import { SidebarLayout } from "@/components/layout/SidebarLayout";

export default function DataStructuresLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SidebarLayout sectionId="data-structures">{children}</SidebarLayout>;
}
