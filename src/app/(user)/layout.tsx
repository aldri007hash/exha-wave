import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import OnboardingTour from "@/components/OnboardingTour"
import AnnouncementPopup from "@/components/AnnouncementPopup"

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <>
      <OnboardingTour />
      <AnnouncementPopup />
      {children}
    </>
  )
}
