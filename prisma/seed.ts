import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("doctor123", 10);

  const doctors = [
    { name: "Dr. Sarah Mitchell", email: "sarah@tshastho.com", phone: "01711000001", specialty: "Cardiologist", licenseNumber: "BMDC-001", experience: 12, fee: 1500 },
    { name: "Prof. James Wilson", email: "james@tshastho.com", phone: "01711000002", specialty: "Orthopedic Surgeon", licenseNumber: "BMDC-002", experience: 18, fee: 2000 },
    { name: "Dr. Aisha Rahman", email: "aisha@tshastho.com", phone: "01711000003", specialty: "Neurologist", licenseNumber: "BMDC-003", experience: 8, fee: 1200 },
    { name: "Dr. Michael Chen", email: "michael@tshastho.com", phone: "01711000004", specialty: "Pediatrician", licenseNumber: "BMDC-004", experience: 10, fee: 1000 },
    { name: "Dr. Priya Sharma", email: "priya@tshastho.com", phone: "01711000005", specialty: "Dermatologist", licenseNumber: "BMDC-005", experience: 7, fee: 1000 },
    { name: "Dr. John Roberts", email: "john@tshastho.com", phone: "01711000006", specialty: "Oncologist", licenseNumber: "BMDC-006", experience: 15, fee: 2500 },
    { name: "Dr. Fatima Khan", email: "fatima.k@tshastho.com", phone: "01711000007", specialty: "Gynecologist", licenseNumber: "BMDC-007", experience: 9, fee: 1200 },
    { name: "Dr. Rahim Ahmed", email: "rahim@tshastho.com", phone: "01711000008", specialty: "Medicine Specialist", licenseNumber: "BMDC-008", experience: 11, fee: 800 },
  ];

  for (const doc of doctors) {
    await prisma.user.create({
      data: {
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        password: password,
        role: "DOCTOR",
        doctorProfile: {
          create: {
            specialty: doc.specialty,
            licenseNumber: doc.licenseNumber,
            experience: doc.experience,
            consultationFee: doc.fee,
          },
        },
      },
    });
  }

  console.log("✅ ৮ জন ডাক্তার সফলভাবে ডাটাবেজে যোগ হয়েছে!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
