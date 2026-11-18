export const GROUPS = [
  { v: "A_POS", l: "A+" }, { v: "A_NEG", l: "A-" },
  { v: "B_POS", l: "B+" }, { v: "B_NEG", l: "B-" },
  { v: "O_POS", l: "O+" }, { v: "O_NEG", l: "O-" },
  { v: "AB_POS", l: "AB+" }, { v: "AB_NEG", l: "AB-" },
];
export const groupLabel = (v: string) => GROUPS.find((g) => g.v === v)?.l || v;

export const DIVISIONS: Record<string, string[]> = {
  Dhaka: ["Dhaka","Gazipur","Narayanganj","Narsingdi","Manikganj","Munshiganj","Tangail","Kishoreganj","Faridpur","Gopalganj","Madaripur","Rajbari","Shariatpur"],
  Chattogram: ["Chattogram","Cox's Bazar","Cumilla","Brahmanbaria","Chandpur","Lakshmipur","Noakhali","Feni","Khagrachhari","Rangamati","Bandarban"],
  Rajshahi: ["Rajshahi","Bogura","Joypurhat","Naogaon","Natore","Chapainawabganj","Pabna","Sirajganj"],
  Khulna: ["Khulna","Bagerhat","Chuadanga","Jashore","Jhenaidah","Kushtia","Magura","Meherpur","Narail","Satkhira"],
  Barishal: ["Barishal","Barguna","Bhola","Jhalokathi","Patuakhali","Pirojpur"],
  Sylhet: ["Sylhet","Habiganj","Moulvibazar","Sunamganj"],
  Rangpur: ["Rangpur","Dinajpur","Gaibandha","Kurigram","Lalmonirhat","Nilphamari","Panchagarh","Thakurgaon"],
  Mymensingh: ["Mymensingh","Jamalpur","Netrokona","Sherpur"],
};
export const DISTRICTS = Object.values(DIVISIONS).flat().sort((a, b) => a.localeCompare(b));
export const divisionOf = (district: string) =>
  Object.entries(DIVISIONS).find(([, l]) => l.includes(district))?.[0] || "";
