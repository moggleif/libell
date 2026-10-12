// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createMountingPicker, createPlacementPicker } from './mountingPicker';
import { setLanguage } from './i18n';
import type { Facing, EasyLevelPlacement } from '../domain/mountingFacing';

setLanguage('en');

// Regression pin for the #419 refactor (shared SVG helper): the full
// markup of both pickers, before and after a pick, for each vehicle and
// box shape, must stay exactly as it is.
describe('mounting picker output (#419)', () => {
  for (const vehicle of ['motorhome', 'caravan'] as const) {
    for (const shape of ['upright', 'flat'] as const) {
      it(`facing picker, ${vehicle}, ${shape} box`, () => {
        let facing: Facing | null = null;
        const picker = createMountingPicker({
          shape,
          getVehicleType: () => vehicle,
          getFacing: () => facing,
          setFacing: (picked) => {
            facing = picked;
          },
        });
        const markup = [picker.element.outerHTML];
        picker.element.querySelector<HTMLButtonElement>('.mounting-picker__button--right')!.click();
        markup.push(picker.element.outerHTML);
        expect(markup).toMatchSnapshot();
      });
    }

    it(`placement picker, ${vehicle}`, () => {
      let placement: EasyLevelPlacement | null = null;
      const picker = createPlacementPicker({
        getVehicleType: () => vehicle,
        getPlacement: () => placement,
        setPlacement: (picked) => {
          placement = picked;
        },
      });
      const markup = [picker.element.outerHTML];
      picker.element.querySelector<HTMLButtonElement>('.placement-picker__button--short')!.click();
      markup.push(picker.element.outerHTML);
      expect(markup).toMatchSnapshot();
    });
  }
});
