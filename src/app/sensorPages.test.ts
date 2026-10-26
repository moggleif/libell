// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FakePage {
  element: HTMLElement;
  isOpen: () => boolean;
  open: ReturnType<typeof vi.fn>;
}

const fakes = vi.hoisted(() => ({
  available: true,
  ios: false,
  list: null as unknown as FakePage & {
    statusElements: HTMLElement[];
    openSource: ReturnType<typeof vi.fn>;
    refreshLive: ReturnType<typeof vi.fn>;
  },
  guide: null as unknown as FakePage,
  unsupported: null as unknown as FakePage,
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
    const page = (name: string): FakePage => ({
      element: el(name),
      isOpen: () => true,
      open: vi.fn(),
    });
    fakes.list = {
      ...page('list'),
      statusElements: [el('box-a'), el('box-b')],
      openSource: vi.fn(),
      refreshLive: vi.fn(),
    };
    fakes.guide = page('guide');
    fakes.unsupported = page('unsupported');
  });

  const ids = () => [...document.body.children].map((e) => e.id);

  it('mounts the list, then each box page on top of it, once loaded', async () => {
    const optionsFor = vi.fn();
    const pages = mountSensorPages(optionsFor);
    expect(pages.supported).toBe(true);
    expect(pages.showIosGuide).toBe(false);
    expect(pages.sensorPage.isOpen()).toBe(false);
    await pages.load();
    expect(fakes.optionsFor).toBe(optionsFor);
    expect(ids()).toEqual(['list', 'box-a', 'box-b']);
    expect(pages.sensorPage.isOpen()).toBe(true);
  });

  it('opens the list or a box page, loading it first (#708)', async () => {
    const pages = mountSensorPages(vi.fn());
    pages.sensorPage.open();
    pages.boxListPage!.openSource('xparkle');
    await vi.waitFor(() => expect(fakes.list.open).toHaveBeenCalledTimes(1));
    expect(fakes.list.openSource).toHaveBeenCalledWith('xparkle');
  });

  it('refreshes the live rows only once the page is in', async () => {
    const pages = mountSensorPages(vi.fn());
    pages.boxListPage!.refreshLive();
    expect(fakes.list.refreshLive).not.toHaveBeenCalled();
    await pages.load();
    pages.boxListPage!.refreshLive();
    expect(fakes.list.refreshLive).toHaveBeenCalledTimes(1);
  });

  it("mounts iOS's guide where there is no Web Bluetooth", async () => {
    fakes.available = false;
    fakes.ios = true;
    const pages = mountSensorPages(vi.fn());
    expect(pages).toMatchObject({ supported: false, showIosGuide: true, boxListPage: null });
    pages.sensorPage.open();
    await vi.waitFor(() => expect(fakes.guide.open).toHaveBeenCalledTimes(1));
    expect(ids()).toEqual(['guide']);
  });

  it('mounts a page that explains the missing Web Bluetooth elsewhere (#507)', async () => {
    fakes.available = false;
    const pages = mountSensorPages(vi.fn());
    expect(pages).toMatchObject({
      supported: false,
      showIosGuide: false,
      boxListPage: null,
    });
    await pages.load();
    expect(ids()).toEqual(['unsupported']);
  });
});
