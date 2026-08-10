import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Roadmap from "@/components/Roadmap";
import TopNav from "@/components/TopNav";
import AllowlistSection from "@/components/funnel/AllowlistSection";
import LeaderboardSection from "@/components/leaderboard/LeaderboardSection";
import Vault from "@/components/vault/Vault";

export default function Page() {
  return (
    <>
      <TopNav />
      <main id="main">
        <Hero />
        <Vault />
        <Roadmap />
        <AllowlistSection />
        <LeaderboardSection />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
