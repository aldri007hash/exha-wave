import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import { authOptions } from "@/lib/auth";
import { AudioProvider } from "@/context/AudioContext";
import ForceLogoutPolling from "@/components/admin/ForceLogoutPolling";
import AdminThemeInit from "@/components/admin/AdminThemeInit";
import AdminAudioPlayer from "@/components/admin/AdminAudioPlayer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Hanya ADMIN dan SUPER_ADMIN yang boleh akses
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }

  return (
    <AudioProvider>
      <AdminThemeInit />
      <ForceLogoutPolling />
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 admin-content text-foreground">
            {children}
          </main>
        </div>
      </div>
      <AdminAudioPlayer />
    </AudioProvider>
  );
}
