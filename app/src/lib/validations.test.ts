import { describe, it, expect } from "vitest";
import {
  CaseSchema,
  normalizePhone,
  titleCase,
  RegisterSchema,
} from "@/lib/validations";

describe("CaseSchema Validation", () => {
  it("should validate a valid case", () => {
    const result = CaseSchema.safeParse({
      caseId: "C-1001",
      applicantName: "John Doe",
      dob: "1990-03-14",
      email: "john@example.com",
      phone: "+919876543210",
      category: "TAX",
      priority: "HIGH",
    });

    expect(result.success).toBe(true);
  });

  it("should fail for missing required fields", () => {
    const result = CaseSchema.safeParse({
      applicantName: "John Doe",
      dob: "1990-03-14",
      category: "TAX",
    });

    expect(result.success).toBe(false);
  });

  it("should fail for invalid category", () => {
    const result = CaseSchema.safeParse({
      caseId: "C-1001",
      applicantName: "John Doe",
      dob: "1990-03-14",
      category: "INVALID",
    });

    expect(result.success).toBe(false);
  });

  it("should default priority to LOW", () => {
    const result = CaseSchema.safeParse({
      caseId: "C-1001",
      applicantName: "John Doe",
      dob: "1990-03-14",
      category: "TAX",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("LOW");
    }
  });

  it("should fail for future date of birth", () => {
    const result = CaseSchema.safeParse({
      caseId: "C-1001",
      applicantName: "John Doe",
      dob: "2050-01-01",
      category: "TAX",
    });

    expect(result.success).toBe(false);
  });

  it("should accept optional email as empty string", () => {
    const result = CaseSchema.safeParse({
      caseId: "C-1001",
      applicantName: "John Doe",
      dob: "1990-03-14",
      email: "",
      category: "TAX",
    });

    expect(result.success).toBe(true);
  });
});

describe("normalizePhone", () => {
  it("should normalize Indian phone numbers", () => {
    const result = normalizePhone("9876543210");
    expect(result).toBe("+919876543210");
  });

  it("should keep E.164 format unchanged", () => {
    const result = normalizePhone("+919876543210");
    expect(result).toBe("+919876543210");
  });

  it("should return null for empty string", () => {
    const result = normalizePhone("");
    expect(result).toBeNull();
  });

  it("should return null for invalid phone", () => {
    const result = normalizePhone("12345");
    expect(result).toBeNull();
  });
});

describe("titleCase", () => {
  it("should convert to title case", () => {
    expect(titleCase("john doe")).toBe("John Doe");
  });

  it("should handle all caps", () => {
    expect(titleCase("JOHN DOE")).toBe("John Doe");
  });

  it("should handle mixed case", () => {
    expect(titleCase("jOHN dOE")).toBe("John Doe");
  });

  it("should trim whitespace", () => {
    expect(titleCase("  john doe  ")).toBe("John Doe");
  });

  it("should handle multiple spaces", () => {
    expect(titleCase("john   doe")).toBe("John Doe");
  });
});

describe("RegisterSchema Validation", () => {
  it("should validate a valid registration", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
  });

  it("should fail for weak password", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "password",
      name: "Test User",
    });

    expect(result.success).toBe(false);
  });

  it("should fail for invalid email", () => {
    const result = RegisterSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
      name: "Test User",
    });

    expect(result.success).toBe(false);
  });

  it("should default role to OPERATOR", () => {
    const result = RegisterSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("OPERATOR");
    }
  });
});
