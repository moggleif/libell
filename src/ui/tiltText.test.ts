import { describe, expect, it } from 'vitest';
import { signedDegrees, tiltDegreesText } from './tiltText';

describe('signedDegrees (#510)', () => {
  it('writes one decimal with a plus or a true minus sign', () => {
    expect(signedDegrees(1.25)).toBe('+1.3°');
    expect(signedDegrees(-0.34)).toBe('−0.3°');
    expect(signedDegrees(0)).toBe('+0.0°');
  });
});

describe('tiltDegreesText (#510)', () => {
  it('puts front/back first, then side/side', () => {
    expect(tiltDegreesText({ rollDeg: 2, pitchDeg: -1 })).toBe(
      'Front/back −1.0° · Side/side +2.0°',
    );
  });

  it('takes the separator the main screen spaces wider', () => {
    expect(tiltDegreesText({ rollDeg: 0, pitchDeg: 0 }, '  ·  ')).toBe(
      'Front/back +0.0°  ·  Side/side +0.0°',
    );
  });
});
