import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import TalentSidebar from "@/components/layout/TalentSidebar";
import TalentHeader from "@/components/layout/TalentHeader";
import { authOptions } from "@/lib/auth";

export default async function TalentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "TALENT") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[#FAF7F2] dark:bg-[#1A0F0F]">
      <TalentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TalentHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 text-[#4A0E2E] dark:text-[#F5E6D3]">
          {children}
        </main>
      </div>
    </div>
  );
}
