/** @jest-environment node */
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
import { isEligible, parseGroup, eligibleWhere } from "@/lib/blood";
import { DONATION_GAP_DAYS } from "@/lib/blood-rules";
import { stockStatus } from "@/lib/blood-bank-public";

const DAY = 86400000;
const ago = (d: number) => new Date(Date.now() - d * DAY);

describe("isEligible", () => {
  it("allows donors who never donated", () => expect(isEligible(null, "MALE")).toBe(true));
  it("blocks a male before the gap", () => expect(isEligible(ago(DONATION_GAP_DAYS.male - 1), "MALE")).toBe(false));
  it("allows a male after the gap", () => expect(isEligible(ago(DONATION_GAP_DAYS.male + 1), "MALE")).toBe(true));
  it("blocks a female inside her longer gap", () => expect(isEligible(ago(DONATION_GAP_DAYS.male + 1), "FEMALE")).toBe(false));
  it("allows a female after her gap", () => expect(isEligible(ago(DONATION_GAP_DAYS.female + 1), "FEMALE")).toBe(true));
});

describe("parseGroup", () => {
  it("parses symbols", () => {
    expect(parseGroup("A+")).toBe("A_POS");
    expect(parseGroup(" ab- ")).toBe("AB_NEG");
  });
  it("parses enum keys", () => expect(parseGroup("O_POS")).toBe("O_POS"));
  it("rejects garbage", () => {
    expect(parseGroup("Z+")).toBeNull();
    expect(parseGroup(5)).toBeNull();
    expect(parseGroup(null)).toBeNull();
  });
});

describe("eligibleWhere", () => {
  it("only returns available donors", () => expect(eligibleWhere().isAvailable).toBe(true));
});

describe("stockStatus", () => {
  it("maps counts to status", () => {
    expect(stockStatus(0)).toBe("OUT");
    expect(stockStatus(-1)).toBe("OUT");
    expect(stockStatus(1)).toBe("LOW");
    expect(stockStatus(3)).toBe("LOW");
    expect(stockStatus(4)).toBe("AVAILABLE");
  });
});
