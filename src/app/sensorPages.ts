/**
 * The sensor's pages, reached from the top bar's sensor icon and Help: one
 * list section and one own page per available box, or, on iOS without Web
 * Bluetooth, a guide to the Bluefy workaround (R39). Any other browser
 * without Web Bluetooth gets a page that says so and names one that works
 * (#507): never a silently broken option. Which one applies is known at
 * start; the page itself loads after the first screen (ADR 0024).
 */
import { availableBoxes, hasAvailableBox } from '../sensor/boxes';
import type { BoxDescriptor } from '../sensor/boxes';
import { isIos } from '../ui/platform';
import type { BoxListPage, SensorPage, SensorPageOptions } from '../ui/sensorPage';
import { lazyPart, whenIdle } from './lazyPart';

export interface SensorPages {
  /** Web Bluetooth and at least one box type are available. */
  supported: boolean;
  showIosGuide: boolean;
  /** The box list with each box's own page; loads it first. */
  boxListPage: Pick<BoxListPage, 'openSource' | 'refreshLive'> | null;
  /** The box list, iOS's guide, or why no box can connect here, as one page. */
  sensorPage: Pick<SensorPage, 'isOpen' | 'open'>;
  /** Fetches and mounts the page now, if not already. */
  load(): Promise<void>;
}

interface Mounted {
  page: SensorPage;
  list: BoxListPage | null;
}

export function mountSensorPages(
  optionsFor: (descriptor: BoxDescriptor) => SensorPageOptions,
): SensorPages {
  const supported = hasAvailableBox();
  const showIosGuide = !supported && isIos();
  let mounted: Mounted | undefined;
  const load = lazyPart(async () => {
    mounted = append(await createPages(supported, showIosGuide, optionsFor));
    return mounted;
  });
  const whenLoaded = (act: (pages: Mounted) => void) => void load().then((m) => m && act(m));
  whenIdle(() => void load());
  return {
    supported,
    showIosGuide,
    boxListPage: supported
      ? {
          openSource: (id) => whenLoaded((pages) => pages.list?.openSource(id)),
          // Every frame: a no-op until the page is in, as while it is closed.
          refreshLive: () => mounted?.list?.refreshLive(),
        }
      : null,
    sensorPage: {
      isOpen: () => mounted?.page.isOpen() ?? false,
      open: () => whenLoaded((pages) => pages.page.open()),
    },
    load: () => load().then(() => undefined),
  };
}

async function createPages(
  supported: boolean,
  showIosGuide: boolean,
  optionsFor: (descriptor: BoxDescriptor) => SensorPageOptions,
): Promise<Mounted> {
  if (supported) {
    const { createSensorPage } = await import('../ui/sensorPage');
    const list = createSensorPage(availableBoxes(), optionsFor);
    return { page: list, list };
  }
  const page = showIosGuide
    ? (await import('../ui/iosSensorGuidePage')).createIosSensorGuidePage()
    : (await import('../ui/unsupportedSensorPage')).createUnsupportedSensorPage();
  return { page, list: null };
}

function append(pages: Mounted): Mounted {
  document.body.append(pages.page.element);
  // After the list: a box's own page paints on top of it when both are
  // open at once.
  if (pages.list) document.body.append(...pages.list.statusElements);
  return pages;
}
