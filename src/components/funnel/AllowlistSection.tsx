import Reveal from "../ui/Reveal";
import Section from "../ui/Section";
import AllowlistFunnel from "./AllowlistFunnel";

export default function AllowlistSection() {
  return (
    <Section
      id="allowlist"
      eyebrow="Allowlist"
      title="Three small things and you're on the list."
      intro="No wallet connection, no signature, nothing to approve. We ask for an address as plain text and that's the extent of it."
      headerClassName="mx-auto text-center"
      className="bg-squib-wash/60"
    >
      <Reveal>
        <AllowlistFunnel />
      </Reveal>
    </Section>
  );
}
