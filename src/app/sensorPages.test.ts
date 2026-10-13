// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fakes = vi.hoisted(() => ({
  available: true,
  ios: false,
  list: null as unknown as { element: HTMLElement; statusElements: HTMLElement[] },
  guide: null as unknown as { element: HTMLElement },
  unsupported: null as unknown as { element: HTMLElement },
  optionsFor: null as unknown,
}));
vi.mock('../sensor/boxes', () => ({
  hasAvailableBox: () => fakes.available,
  availableBoxes: () => ['box'],
}));
vi.mock('../ui/platform', () => ({ isIos: () => fakes.ios }));
vi.mock('../ui/iosSensorGuidePage', () => ({ createIosSensorGuidePage: () => fakes.guide }));
vi.mock('../ui/unsupportedSensorPage', () => ({
  createUnsupportedSensorPage: () => fakes.unsupported,
}));
vi.mock('../ui/sensorPage', () => ({
  createSensorPage: (_sensors: unknown, optionsFor: unknown) => {
    fakes.optionsFor = optionsFor;
    return fakes.list;
  },
}));

const { mountSensorPages } = await import('./sensorPages');

describe('mountSensorPages', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    fakes.available = true;
    fakes.ios = false;
    const el = (name: string) => Object.assign(document.createElement('div'), { id: name });
    fakes.list = { element: el('list'), statusElements: [el('box-a'), el('box-b')] };
    fakes.guide = { element: el('guide') };
    fakes.unsupported = { element: el('unsupported') };
  });

  it('mounts the list, then each box page on top of it', () => {
    const optionsFor = vi.fn();
    const pages = mountSensorPages(optionsFor);
    expect(pages.supported).toBe(true);
    expect(pages.showIosGuide).toBe(false);
    expect(pages.boxListPage).toBe(fakes.list);
    expect(pages.sensorPage).toBe(fakes.list);
    expect(fakes.optionsFor).toBe(optionsFor);
    expect([...document.body.children].map((e) => e.id)).toEqual(['list', 'box-a', 'box-b']);
  });

  it("mounts iOS's guide where there is no Web Bluetooth", () => {
    fakes.available = false;
    fakes.ios = true;
    const pages = mountSensorPages(vi.fn());
    expect(pages).toMatchObject({ supported: false, showIosGuide: true, boxListPage: null });
    expect(pages.sensorPage).toBe(fakes.guide);
    expect([...document.body.children].map((e) => e.id)).toEqual(['guide']);
  });

  it('mounts a page that explains the missing Web Bluetooth elsewhere (#507)', () => {
    fakes.available = false;
    const pages = mountSensorPages(vi.fn());
    expect(pages).toMatchObject({
      supported: false,
      showIosGuide: false,
      boxListPage: null,
    });
    expect(pages.sensorPage).toBe(fakes.unsupported);
    expect([...document.body.children].map((e) => e.id)).toEqual(['unsupported']);
  });
});
