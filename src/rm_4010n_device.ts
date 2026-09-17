/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ButtonEvent, DeviceType, DictationDeviceBase, ImplementationType,} from './dictation_device_base';
import {MotionEvent, MotionEventListener} from './speechmike_hid_device';

const BUTTON_MAPPINGS = new Map<ButtonEvent, number>([
  [ButtonEvent.PLAY, 1 << 1],
  [ButtonEvent.REWIND, 1 << 2],
  [ButtonEvent.FORWARD, 1 << 3],
  [ButtonEvent.RECORD, 1 << 4],
  [ButtonEvent.INSTR, 1 << 6],
  [ButtonEvent.COMMAND, 1 << 10],
  [ButtonEvent.F1_A, 1 << 14],
  [ButtonEvent.F2_B, 1 << 15],
  [ButtonEvent.F3_C, 1 << 19],
  [ButtonEvent.F4_D, 1 << 22],
  [ButtonEvent.INS_OVR, 1 << 24],
  [ButtonEvent.MOUSE_LEFT, (1 << 20) | (1 << 23)],
  [ButtonEvent.MOUSE_RIGHT, 1 << 21],
  [ButtonEvent.MOUSE_CENTER, 1 << 29],
]);

// Motion events are identified by a 6-byte signature starting at byte offset 4
// in the input report. The signature [0x03, 0x00, 0x00, 0x06, 0xd0, 0x19] was
// determined by capturing input reports from the physical RM-4010N device and
// observing that all motion event reports share this byte pattern. The byte at
// offset 10 (MOTION_EVENT_OFFSET + 6) indicates the motion state: 1 = picked
// up, 0 = laid down.
const MOTION_EVENT_SIGNATURE = [0x03, 0x00, 0x00, 0x06, 0xd0, 0x19];
const MOTION_EVENT_OFFSET = 4;

export class RM4010NDevice extends DictationDeviceBase {
  readonly implType = ImplementationType.RM_4010N;

  protected readonly motionEventListeners = new Set<MotionEventListener>();

  static create(hidDevice: HIDDevice) {
    return new RM4010NDevice(hidDevice);
  }

  addMotionEventListener(listener: MotionEventListener) {
    this.motionEventListeners.add(listener);
  }

  getDeviceType(): DeviceType {
    return DeviceType.RM_4010N;
  }

  protected override async onInputReport(event: HIDInputReportEvent) {
    const data = event.data;

    if (this.isMotionEvent(data)) {
      await this.handleMotionEvent(data);
      return;
    }

    await this.handleButtonPress(data);
  }

  protected getButtonMappings(): Map<ButtonEvent, number> {
    return BUTTON_MAPPINGS;
  }

  protected getInputBitmask(data: DataView): number {
    return data.getUint32(0, /* littleEndian= */ true);
  }

  protected getThisAsDictationDevice(): RM4010NDevice {
    return this;
  }

  protected isMotionEvent(data: DataView): boolean {
    if (data.byteLength <
        MOTION_EVENT_OFFSET + MOTION_EVENT_SIGNATURE.length + 1) {
      return false;
    }
    for (let i = 0; i < MOTION_EVENT_SIGNATURE.length; i++) {
      if (data.getUint8(MOTION_EVENT_OFFSET + i) !==
          MOTION_EVENT_SIGNATURE[i]) {
        return false;
      }
    }
    return true;
  }

  protected async handleMotionEvent(data: DataView) {
    const MOTION_STATE_OFFSET =
        MOTION_EVENT_OFFSET + MOTION_EVENT_SIGNATURE.length;
    const isPickedUp = data.getUint8(MOTION_STATE_OFFSET) === 1;
    const motionEvent =
        isPickedUp ? MotionEvent.PICKED_UP : MotionEvent.LAYED_DOWN;

    await Promise.all([...this.motionEventListeners].map(
        listener => listener(this.getThisAsDictationDevice(), motionEvent)));
  }
}
