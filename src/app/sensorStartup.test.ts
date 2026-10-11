// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { OrientationSensor, SensorState } from '../sensor/orientation';
import { t } from '../ui/i18n';
import { startSensors, type SensorStartupDeps } from './sensorStartup';

function setup(overrides: Partial<SensorStartupDeps> = {}, answer: SensorState = 'granted') {
  const root = document.createElement('div');
  root.append(document.createElement('span'));
  const start = vi.fn(() => Promise.resolve(answer));
  const deps: SensorStartupDeps = {
    root,
    sensor: () => ({ start }) as unknown as OrientationSensor,
    attemptAutoReconnect: () => Promise.resolve(false),
    showLevelScreen: vi.fn(),
    isSensorSupported: () => true,
    needsPermissionGesture: () => false,
    isSecureContext: () => true,
    ...overrides,
  };
  return { deps, root, start };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const text = (root: HTMLElement) => root.querySelector('.app__hint')?.textContent;

describe('startSensors', () => {
  it('leaves the start-up to a remembered box that took over', async () => {
    const { deps, start } = setup({ attemptAutoReconnect: () => Promise.resolve(true) });
    await startSensors(deps);
    await flush();
    expect(start).not.toHaveBeenCalled();
    expect(deps.showLevelScreen).not.toHaveBeenCalled();
  });

  it('starts the phone and shows the level screen once granted', async () => {
    const { deps, start } = setup();
    await startSensors(deps);
    await flush();
    expect(start).toHaveBeenCalledTimes(1);
    expect(deps.showLevelScreen).toHaveBeenCalledTimes(1);
  });

  it('says so when motion access is denied', async () => {
    const { deps, root } = setup({}, 'denied');
    await startSensors(deps);
    await flush();
    expect(root.children).toHaveLength(1);
    expect(text(root)).toBe(t('main.denied'));
  });

  it('says there are no sensors, without starting one', async () => {
    const { deps, root, start } = setup({ isSensorSupported: () => false });
    await startSensors(deps);
    expect(start).not.toHaveBeenCalled();
    expect(text(root)).toBe(t('main.noSensors'));
  });

  it('asks for HTTPS outside a secure context', async () => {
    const { deps, root } = setup({ isSensorSupported: () => false, isSecureContext: () => false });
    await startSensors(deps);
    expect(text(root)).toBe(t('main.https'));
  });

  it('waits for a tap where motion access needs one (iOS)', async () => {
    const { deps, root, start } = setup({ needsPermissionGesture: () => true });
    await startSensors(deps);
    expect(start).not.toHaveBeenCalled();
    expect(text(root)).toBe(t('main.hint'));
    const button = root.querySelector<HTMLButtonElement>('button.app__start')!;
    expect(button.textContent).toBe(t('main.start'));
    button.click();
    await flush();
    expect(start).toHaveBeenCalledTimes(1);
    expect(deps.showLevelScreen).toHaveBeenCalledTimes(1);
  });
});
