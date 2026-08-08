import dynamic from "next/dynamic"

const SmartEstimatorContent = dynamic(() => import("./SmartEstimatorContent"), {
  ssr: false,
  loading: () => null,
})

export default function SmartEstimator({ platforms }: { platforms: any[] }) {
  return <SmartEstimatorContent platforms={platforms} />
}
