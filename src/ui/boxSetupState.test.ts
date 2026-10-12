import { describe, expect, it } from 'vitest';
import {
  cardMark,
  cardStateText,
  connectErrorText,
  directionTitle,
  expandedStep,
  positionMark,
  positionReport,
  zeroMessage,
  zeroTitle,
} from './boxSetupState';
import { setLanguage, t } from './i18n';

setLanguage('en');

describe('the card (#416)', () => {
  it('marks + not in use, ✓ connected, ! lost or refused', () => {
    expect(cardMark('notConnected')).toBe('+');
    expect(cardMark('connected')).toBe('✓');
    expect(cardMark('lost')).toBe('!');
    expect(cardMark('password')).toBe('!');
  });

  it('says nothing under the name while not in use, else the state', () => {
    expect(cardStateText('notConnected')).toBe('');
    expect(cardStateText('connected')).toBe(t('box.state.connected'));
    expect(cardStateText('lost')).toBe(t('box.state.lost'));
    expect(cardStateText('password')).toBe(t('box.state.password'));
  });

  it('explains a connect that did not succeed, and is quiet after one that did', () => {
    expect(connectErrorText('granted', 'Xparkle')).toBeNull();
    expect(connectErrorText('unsupported', 'Xparkle')).toBe(t('sensorSource.err.unsupported'));
    expect(connectErrorText('denied', 'Xparkle')).toBe(
      t('sensorSource.err.failed', { name: 'Xparkle' }),
    );
  });
});

describe('positionReport', () => {
  it('waits for a reading', () => {
    expect(positionReport(null, 'upright')).toEqual({
      text: t('box.step.position.waiting'),
      ok: null,
    });
    expect(positionMark(null)).toBe('');
  });

  it('says an upright box stands or lies, with ✓ or !', () => {
    expect(positionReport({ pitchDeg: 1, rollDeg: -2 }, 'upright')).toEqual({
      text: t('box.step.position.upright.ok'),
      ok: true,
    });
    expect(positionReport({ pitchDeg: -88, rollDeg: 3 }, 'upright')).toEqual({
      text: t('box.step.position.upright.bad'),
      ok: false,
    });
    expect(positionMark(true)).toBe('✓ ');
    expect(positionMark(false)).toBe('! ');
  });

  it('tells a flat box past a right angle that its lid is down (#362)', () => {
    for (const tilt of [
      { pitchDeg: 179, rollDeg: 0 },
      { pitchDeg: 0, rollDeg: -91 },
    ]) {
      expect(positionReport(tilt, 'flat').text).toBe(t('box.step.position.flat.upsideDown'));
    }
    expect(positionReport({ pitchDeg: 179, rollDeg: 0 }, 'upright').text).not.toBe(
      t('box.step.position.flat.upsideDown'),
    );
  });
});

describe('the step titles', () => {
  it('names the picked direction in lower case, or asks', () => {
    expect(directionTitle('Points to the rear')).toBe(
      `${t('box.step.direction.done')}: points to the rear`,
    );
    expect(directionTitle(null)).toBe(t('box.step.direction.todo'));
  });

  it('says zeroed, or asks for the zero', () => {
    expect(zeroTitle(true, null)).toBe(t('box.step.zero.done'));
    expect(zeroTitle(false, 123)).toBe(t('box.step.zero.todo'));
  });
});

describe('zeroMessage (#425)', () => {
  it('offers Zero anyway only after a tilt warning', () => {
    expect(zeroMessage({ warning: 'Level?' })).toEqual({ text: 'Level?', warned: true });
    expect(zeroMessage('Failed')).toEqual({ text: 'Failed', warned: false });
    expect(zeroMessage(null)).toEqual({ text: null, warned: false });
  });
});

describe('expandedStep', () => {
  const steps = [
    { step: 'direction', done: true },
    { step: 'zero', done: false },
  ] as const;

  it('follows the first step not yet done', () => {
    expect(expandedStep({ kind: 'next' }, steps)).toBe('zero');
    expect(
      expandedStep({ kind: 'next' }, [
        { step: 'direction', done: true },
        { step: 'zero', done: true },
      ]),
    ).toBeNull();
  });

  it('keeps the step the user opened, and none once one was closed', () => {
    expect(expandedStep({ kind: 'opened', step: 'direction' }, steps)).toBe('direction');
    expect(expandedStep({ kind: 'opened', step: 'direction' }, [steps[1]])).toBeNull();
    expect(expandedStep({ kind: 'closed' }, steps)).toBeNull();
  });
});
