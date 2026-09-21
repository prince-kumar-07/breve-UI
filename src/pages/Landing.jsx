import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Analytics from "../components/Analytics";
import Features from "../components/Features";
import Plans from "../components/Plans";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Analytics />
        <Features />
        <Plans />
      </main>
      <Footer />
    </>
  );
}
