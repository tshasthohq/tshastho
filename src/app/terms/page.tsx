import LegalPage from "@/components/LegalPage";


export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="19 November 2026"
      intro="These terms apply when you use Tshastho. By creating an account or using our website or app, you agree to them. Please read them carefully."
      sections={[
        { h: "About Tshastho", p: [
          "Tshastho is a platform that connects patients with independent doctors, pharmacies and diagnostic providers. Tshastho itself does not practise medicine and does not give medical advice. Medical advice and treatment come from the doctors and providers you choose.",
        ] },
        { h: "Not for emergencies", p: [
          "Tshastho is not an emergency service. In an emergency, call 999 or go to the nearest hospital immediately.",
        ] },
        { h: "Your account", list: [
          "You must give accurate information and keep it up to date.",
          "You are responsible for activity on your account, so keep your password private.",
          "You must be an adult to hold an account. A parent or guardian may book care for a child.",
        ] },
        { h: "Appointments and consultations", p: [
          "Consultation fees and availability are set by each doctor. Cancellation and rescheduling rules shown at the time of booking apply. Video consultations may not suit every condition, and a doctor may advise an in-person visit instead.",
        ] },
        { h: "Medicine orders", list: [
          "Prescription-only medicines need a valid prescription.",
          "Prices, VAT, delivery fees and availability are shown before you confirm an order.",
          "Delivery times are estimates. Please check your order on delivery and report any problem promptly.",
        ] },
        { h: "Payments, wallet and refunds", p: [
          "You agree to pay the amounts shown at checkout. Wallet top-ups and refunds follow the rules shown in the app. Refunds, where due, are returned to the original payment method or your wallet.",
        ] },
        { h: "Acceptable use", list: [
          "Do not misuse the service, attempt to break into it, or interfere with others.",
          "Do not post false, harmful or unlawful content, or impersonate anyone.",
          "Do not use the service for fraud or to order medicine you are not entitled to.",
        ] },
        { h: "Your content", p: [
          "You keep ownership of the information and files you submit. You allow us and the providers you choose to use them to deliver the service to you.",
        ] },
        { h: "Doctors and pharmacies", p: [
          "Doctors and pharmacies on Tshastho must hold valid registrations and licences and are responsible for the care and products they provide. We review profiles before listing, but we cannot guarantee any individual outcome.",
        ] },
        { h: "Disclaimers", p: [
          "The service is provided as available. Information on Tshastho is for general purposes and is not a substitute for professional medical advice.",
        ] },
        { h: "Limitation of liability", p: [
          "To the extent permitted by law, Tshastho is not liable for indirect or consequential loss, or for the acts of independent doctors, pharmacies and other providers.",
        ] },
        { h: "Suspension and termination", p: [
          "We may suspend or close accounts that break these terms or put others at risk. You may stop using Tshastho at any time.",
        ] },
        { h: "Changes to these terms", p: [
          "We may update these terms. The latest version is always on this page, and continued use means you accept it.",
        ] },
        { h: "Governing law", p: [
          "These terms are governed by the laws of Bangladesh, and the courts of Bangladesh have jurisdiction.",
        ] },
        { h: "Contact", p: [
          "For questions about these terms, please use our Contact page or call our hotline.",
        ] },
      ]}
    />
  );
}
