import { generateConfirmationCode } from '../reservationService'

// generateConfirmationCode is a pure function with no DB dependencies.

describe('generateConfirmationCode', () => {
  it('returns a string in RG-XXXXXX format', () => {
    const code = generateConfirmationCode()
    expect(code).toMatch(/^RG-[A-Z0-9]{6}$/)
  })

  it('generates codes of consistent length (9 chars: "RG-" + 6)', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateConfirmationCode()).toHaveLength(9)
    }
  })

  it('only contains uppercase letters and digits after the prefix', () => {
    for (let i = 0; i < 50; i++) {
      const suffix = generateConfirmationCode().slice(3) // remove "RG-"
      expect(suffix).toMatch(/^[A-Z0-9]+$/)
    }
  })

  it('generates different codes on successive calls (probabilistic)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateConfirmationCode()))
    // With 36^6 = ~2.1B combinations, 50 calls producing any duplicates would be extraordinary
    expect(codes.size).toBeGreaterThan(40)
  })
})
