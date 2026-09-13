// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { createSensorPage } from './sensorPage';
import type { SensorSourceOptions } from './sensorSourceSection';
import type { EasyLevelStatusOptions } from './easyLevelStatusPage';
import { EASYLEVEL_DESCRIPTOR } from '../sensor/easyLevelSensor';
import type { ExternalSensorDescriptor } from '../sensor/externalSensors';
import { setLanguage, t } from './i18n';

setLanguage('en');

type Options = SensorSourceOptions & EasyLevelStatusOptions;

function makeOptions(overrides: Partial<Options> = {}): Options {
  return {
    sensor: EASYLEVEL_DESCRIPTOR,
    getSensorSource: () => 'phone',
    getSensorState: () => 'idle',
    connectSensor: () => Promise.resolve('unsupported'),
    disconnectSensor: () => {},
    getHealth: () => null,
    getInstallCalibration: () => null,
    calibrateInstall: () => null,
    getInstallCalibrationCapturedAt: () => null,
    checkInstallCalibration: () => 'checked',
    clearInstallCalibration: () => {},
    getCalibratedTilt: () => null,
    getEasyLevelDeviceId: () => null,
    getEasyLevelLastSampleAt: () => null,
    getEasyLevelRawAccel: () => null,
    getEasyLevelStatusBytes: () => null,
    getEasyLevelConnectDelay: () => ({ enabled: false, ms: 300 }),
    setEasyLevelConnectDelay: () => {},
    getMounting: () => 'standard',
    setMounting: () => {},
    ...overrides,
  };
}

// External sensor page (screen-cleanup follow-up): its own standalone
// page, reached only from the top-right sensor-status icon now that the
// ☰ menu no longer carries an "External sensor" entry.
describe('createSensorPage', () => {
  it('starts closed; attach() opens straight to the connect flow with a ✕ close', () => {
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () => makeOptions());
    const button = document.createElement('button');
    page.attach(button);
    expect(page.isOpen()).toBe(false);

    button.click();
    expect(page.isOpen()).toBe(true);
    expect(page.element.querySelector('.menu-page__back')?.textContent).toBe('✕');
    expect(page.element.textContent).toContain('EasyLevel');

    button.click();
    expect(page.isOpen()).toBe(false);
  });

  it("open() opens it programmatically — the sensor-status icon's own trigger", () => {
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () => makeOptions());
    page.open();
    expect(page.isOpen()).toBe(true);
  });

  it('wires the Connect button to connectSensor()', () => {
    const connectSensor = vi.fn(() => Promise.resolve<'granted'>('granted'));
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () => makeOptions({ connectSensor }));
    page.open();
    const button = [...page.element.querySelectorAll('button')].find(
      (b) =>
        b.textContent === t('sensorSource.connect', { name: EASYLEVEL_DESCRIPTOR.displayName }),
    )!;
    button.click();
    expect(connectSensor).toHaveBeenCalledOnce();
  });

  // Sensor status page (screen-cleanup follow-up to #133/#129): tapping the
  // sensor row opens a deeper, separately-attached page.
  describe('the nested status page', () => {
    it('starts closed, and clicking the sensor row opens it once the box is the source', () => {
      // The row only leads anywhere while EasyLevel is actually the active
      // source — the page behind it is that box's own (#244).
      const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () =>
        makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
      );
      expect(page.statusElements[0]!.hasAttribute('hidden')).toBe(true);
      const statusButton = page.element.querySelector<HTMLButtonElement>(
        '.sensor-row__status-button',
      )!;
      statusButton.click();
      expect(page.statusElements[0]!.hasAttribute('hidden')).toBe(false);
      expect(page.statusElements[0]!.textContent).toContain('EasyLevel sensor');
    });

    it('stays closed while the phone is the source — that row is plain text (#244)', () => {
      const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () => makeOptions());
      const row = page.element.querySelector<HTMLButtonElement>('.sensor-row__status-button')!;
      row.click();
      expect(page.statusElements[0]!.hasAttribute('hidden')).toBe(true);
    });

    it('puts the connect half on the list page and the settings half on the sensor page (#226)', () => {
      const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () =>
        makeOptions({ getSensorSource: () => 'easylevel', getSensorState: () => 'granted' }),
      );
      // The list page is only about picking/connecting a source.
      expect(page.element.textContent).toContain('Connect');
      expect(page.element.textContent).not.toContain('Sensor mounting');
      expect(page.element.textContent).not.toContain('Installation offset');
      expect(page.element.textContent).not.toContain('Battery');
      // Per-device settings and health live on the sensor's own page.
      expect(page.statusElements[0]!.textContent).toContain('Sensor mounting');
      expect(page.statusElements[0]!.textContent).toContain('Installation offset');
      expect(page.statusElements[0]!.textContent).toContain('Battery');
    });

    it('shows the settings blocks straight after connecting, with no close-and-reopen (#226)', async () => {
      // The blocks are revealed by `sensorSourceSection.refresh()`, which
      // the connect handler itself deliberately does not call (it only
      // relabels its buttons). Opening the sensor page refreshes on the
      // way in, so connecting and going straight there must already show
      // them populated — pinned here because that ordering is easy to
      // lose in a later refactor and fails only in the running app.
      let source: 'phone' | 'easylevel' = 'phone';
      const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () =>
        makeOptions({
          getSensorSource: () => source,
          getSensorState: () => 'granted',
          connectSensor: () => {
            source = 'easylevel';
            return Promise.resolve('granted');
          },
          getMounting: () => 'rotated180',
        }),
      );
      const connect = [...page.element.querySelectorAll('button')].find(
        (b) => b.textContent === 'Connect EasyLevel sensor',
      )!;
      connect.click();
      await Promise.resolve();
      await Promise.resolve();

      // Straight in via the sensor row — no closing the list page first.
      const statusButton = [...page.element.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Connected to the EasyLevel sensor'),
      )!;
      statusButton.click();

      const mountingHeading = [...page.statusElements[0]!.querySelectorAll('h3')].find(
        (h) => h.textContent === 'Sensor mounting',
      );
      expect(mountingHeading?.closest('[hidden]')).toBeNull();
      // Populated from the current setting, not left at its initial value.
      expect(page.statusElements[0]!.querySelector('select')?.value).toBe('rotated180');
      expect(page.statusElements[0]!.textContent).toContain('No installation offset');
    });

    it('refreshLive() is a no-op while the status page is closed', () => {
      const getHealth = vi.fn(() => null);
      const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () => makeOptions({ getHealth }));
      getHealth.mockClear();
      page.refreshLive();
      expect(getHealth).not.toHaveBeenCalled();
    });

    it('refreshLive() re-reads live values once the status page is open', () => {
      let battery = 80;
      const page = createSensorPage([EASYLEVEL_DESCRIPTOR], () =>
        makeOptions({
          getSensorSource: () => 'easylevel',
          getHealth: () => ({
            batteryPercent: battery,
            temperatureCelsius: 20,
            firmwareLabel: '7',
          }),
        }),
      );
      const statusButton = [...page.element.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Connected to the EasyLevel sensor'),
      )!;
      statusButton.click();
      expect(page.statusElements[0]!.textContent).toContain('Battery: 80%');
      battery = 55;
      page.refreshLive();
      expect(page.statusElements[0]!.textContent).toContain('Battery: 55%');
    });
  });
});

/** A second, differently-shaped box: no temperature, no firmware row, no
 * mounting picker, no debug bytes — the shape the Xparkle RVS01 has. */
const SECOND_BOX: ExternalSensorDescriptor = {
  id: 'phone' as never,
  displayName: 'Second Box',
  isAvailable: () => true,
  capabilities: {
    battery: true,
    temperature: false,
    firmwareVersion: false,
    mounting: false,
    installCalibration: true,
    debugBytes: false,
  },
  staleTimeoutMs: 4000,
};

describe('createSensorPage with more than one source (#268)', () => {
  const SECOND = SECOND_BOX;

  it('lists one row per source, each with its own device page', () => {
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR, SECOND], (sensor) =>
      makeOptions({ sensor }),
    );
    expect(page.statusElements).toHaveLength(2);
    expect(page.element.querySelectorAll('.sensor-row__status-button')).toHaveLength(2);
  });

  it('names each source in its own row, from the descriptor rather than a catalogue', () => {
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR, SECOND], (sensor) =>
      makeOptions({ sensor }),
    );
    expect(page.element.textContent).toContain(EASYLEVEL_DESCRIPTOR.displayName);
    expect(page.element.textContent).toContain('Second Box');
  });

  it('draws only the rows a device can fill — no permanently empty ones (#228)', () => {
    const page = createSensorPage([SECOND], (sensor) => makeOptions({ sensor }));
    const devicePage = page.statusElements[0]!;
    expect(devicePage.textContent).toContain('Battery');
    expect(devicePage.textContent).not.toContain('Temperature');
  });

  it('refreshes whichever device page is open, and no others', () => {
    const health = vi.fn(() => null);
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR, SECOND], (sensor) =>
      makeOptions({
        sensor,
        getSensorSource: () => 'easylevel',
        getSensorState: () => 'granted',
        getHealth: sensor === SECOND ? health : () => null,
      }),
    );
    health.mockClear();
    page.refreshLive();
    expect(health).not.toHaveBeenCalled();
  });
});

describe('a device page shows only its own device (#272)', () => {
  it('hides the debug disclosure for a source with no raw bytes of its own', () => {
    const page = createSensorPage([SECOND_BOX], (sensor) =>
      makeOptions({ sensor, getSensorSource: () => 'phone' }),
    );
    // Its contents are one protocol's debug surface plus the #212
    // connect-delay workaround — a disclosure full of dashes and a control
    // that does nothing would be worse than no disclosure.
    expect(page.statusElements[0]!.textContent).not.toContain('Debug');
  });

  it('keeps it for a source that does have them', () => {
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR], (sensor) => makeOptions({ sensor }));
    expect(page.statusElements[0]!.textContent?.toLowerCase()).toContain('debug');
  });

  it('says the browser requirement once, not once per source', () => {
    const page = createSensorPage([EASYLEVEL_DESCRIPTOR, SECOND_BOX], (sensor) =>
      makeOptions({ sensor }),
    );
    const text = page.element.textContent ?? '';
    expect(text.split('Requires Chrome').length - 1).toBe(1);
  });
});
