import LegalPage from "@/components/LegalPage";


export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="19 November 2026"
      intro="Tshastho connects patients with doctors, pharmacies and diagnostic services in Bangladesh. This policy explains what personal information we collect, why we collect it, and the choices you have."
      sections={[
        { h: "Information we collect", list: [
          "Account details: your name, phone number, email address and password (stored securely).",
          "Health and care information: appointments you book, prescriptions, medicine orders, test reports and notes you choose to share.",
          "Payment and wallet records: top-ups, payments, refunds and invoices. Payment credentials are handled by our payment partners where applicable.",
          "Device and usage information: browser type, IP address and pages visited, used to keep the service secure and working.",
          "Notification settings: if you enable push notifications, we store a notification token for your device.",
        ] },
        { h: "How we use your information", list: [
          "To create your account and provide appointments, consultations, orders and deliveries.",
          "To send confirmations, reminders and updates about your appointments and orders.",
          "To process payments, wallet balances and refunds.",
          "To keep Tshastho secure, prevent fraud and fix problems.",
          "To improve our services and comply with the law.",
        ] },
        { h: "Health information", p: [
          "Health information is sensitive. We share it only with the doctor, pharmacy or diagnostic provider you choose to interact with, and only as needed to give you the service. We do not sell your personal information.",
        ] },
        { h: "Who we share information with", list: [
          "Doctors, pharmacies and diagnostic centres you book or order from.",
          "Delivery and payment partners who help complete your order.",
          "Service providers such as hosting, messaging and notification services, bound to protect your data.",
          "Authorities, when the law requires us to.",
        ] },
        { h: "Cookies and local storage", p: [
          "We use cookies and similar storage to keep you signed in and to remember your choices, such as your language. You can clear them in your browser at any time, though some features may stop working.",
        ] },
        { h: "Notifications", p: [
          "Push notifications are optional. You can turn them off any time in your browser or device settings.",
        ] },
        { h: "How long we keep information", p: [
          "We keep information for as long as your account is active and as needed to provide the service, meet legal and medical record-keeping duties, and resolve disputes.",
        ] },
        { h: "Security", p: [
          "We use reasonable technical and organisational measures to protect your information. No online service can be completely secure, so please keep your password private.",
        ] },
        { h: "Your choices and rights", p: [
          "You can view and update your profile in your account. You can ask us to correct or delete your information through our Contact page. Some records may need to be kept where the law or medical practice requires it.",
        ] },
        { h: "Children", p: [
          "Tshastho is intended for adults. A parent or guardian may use the service to book care for a child.",
        ] },
        { h: "International care", p: [
          "If you use international care services, we may share the information needed with overseas providers, only at your request.",
        ] },
        { h: "Changes to this policy", p: [
          "We may update this policy from time to time. We will post the new version here with a new date.",
        ] },
        { h: "Contact", p: [
          "For privacy questions or requests, please use our Contact page or call our hotline.",
        ] },
      ]}
    />
  );
}
