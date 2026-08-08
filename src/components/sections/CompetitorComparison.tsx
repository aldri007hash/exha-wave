import dynamic from "next/dynamic"

const CompetitorComparisonContent = dynamic(() => import("./CompetitorComparisonContent"), {
  ssr: false,
  loading: () => null,
})

export default function CompetitorComparison() {
  return <CompetitorComparisonContent />
}
