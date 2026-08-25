// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorSourceSection, type SensorSourceOptions } from './sensorSourceSection';
import { setLanguage } from './i18n';

setLanguage('en');

function makeOptions(overrides: Partial<SensorSourceOptions> = {}): SensorSourceOptions {
  return {
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectEasyLevel: () => Promise.resolve('granted'),
    disconnectEasyLevel: () => {},
    ...overrides,
  };
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find((b) => b.textContent === text);
  if (!button) throw new Error(`no button with text "${text}"`);
  return button;
}

describe('createSensorSourceSection (#116)', () => {
  it('shows "Connect" and hides the disconnect button while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions());
    expect(section.element.textContent).toContain('Connect');
    const disconnectButton = [...section.element.querySelectorAll('button')].find((b) => b.hidden);
    expect(disconnectButton).toBeDefined();
  });

  it('shows the connected status and a visible disconnect button once EasyLevel is active', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'easylevel' }));
    expect(section.element.querySelectorAll('button').length).toBe(2);
    const [connectButton, disconnectButton] = section.element.querySelectorAll('button');
    expect(disconnectButton!.hidden).toBe(false);
    expect(connectButton!.textContent).not.toBe('');
  });

  it('clicking connect calls connectEasyLevel() and reflects a successful result', async () => {
    const connectEasyLevel = vi.fn(() => Promise.resolve<'granted'>('granted'));
    const section = createSensorSourceSection(makeOptions({ connectEasyLevel }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    expect(connectEasyLevel).toHaveBeenCalledOnce();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('Connected');
  });

  it('clicking connect surfaces a denied/failed result as an error, not a silent no-op', async () => {
    const connectEasyLevel = () => Promise.resolve<'denied'>('denied');
    const section = createSensorSourceSection(makeOptions({ connectEasyLevel }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent?.toLowerCase()).toContain('could not connect');
  });

  it('surfaces "unsupported" distinctly rather than a generic failure', async () => {
    const connectEasyLevel = () => Promise.resolve<'unsupported'>('unsupported');
    const section = createSensorSourceSection(makeOptions({ connectEasyLevel }));
    const button = findButton(section.element, 'Connect EasyLevel sensor');
    button.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(section.element.textContent).toContain('not supported');
  });

  it('clicking disconnect calls disconnectEasyLevel() and refresh() flips back to the phone', () => {
    const disconnectEasyLevel = vi.fn();
    let source: 'phone' | 'easylevel' = 'easylevel';
    const section = createSensorSourceSection(
      makeOptions({
        getSensorSource: () => source,
        disconnectEasyLevel: () => {
          disconnectEasyLevel();
          source = 'phone';
        },
      }),
    );
    const disconnectButton = findButton(section.element, 'Disconnect');
    disconnectButton.click();
    expect(disconnectEasyLevel).toHaveBeenCalledOnce();
    expect(disconnectButton.hidden).toBe(true);
  });

  it('refresh() re-reads the current source (menu re-opened after a connect elsewhere)', () => {
    let source: 'phone' | 'easylevel' = 'phone';
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => source }));
    source = 'easylevel';
    section.refresh();
    expect(section.element.textContent).toContain('Connected');
  });

  // #129: honest detailed status — connection state distinguishes a live
  // connection from a dropped one, and battery/RSSI/temperature are always
  // spelled out as "not available yet" rather than omitted or fabricated.
  it('shows a distinct disconnected status once the connection is lost, not the plain "connected" text', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    expect(section.element.textContent).toContain('lost');
    expect(section.element.textContent).not.toContain('Connected to the EasyLevel sensor.');
  });

  it('hides the battery/RSSI/temperature detail block while the phone is the active source', () => {
    const section = createSensorSourceSection(makeOptions({ getSensorSource: () => 'phone' }));
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(true);
  });

  it('shows battery/RSSI/temperature explicitly as "not available yet" once EasyLevel is (or was) active — never omitted, never fabricated', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(false);
    expect(detail?.textContent).toContain('Battery');
    expect(detail?.textContent).toContain('Signal strength');
    expect(detail?.textContent).toContain('Temperature');
    const notAvailableCount = (detail?.textContent?.match(/Not available yet/g) ?? []).length;
    expect(notAvailableCount).toBe(3);
  });

  it('still shows the detail block (as "not available yet") for a dropped connection — not omitted on disconnect', () => {
    const section = createSensorSourceSection(
      makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'disconnected' }),
    );
    const detail = section.element.querySelector<HTMLElement>('.menu__detail');
    expect(detail?.hidden).toBe(false);
  });
});
