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

import {DictationDevice} from './dictation_device';

export enum ImplementationType {
  SPEECH_MIKE_HID = 0,
  SPEECH_MIKE_GAMEPAD = 1,
  FOOT_CONTROL = 2,
  POWER_MIC_3 = 3,
}

export enum DeviceType {
  FOOT_CONTROL_ACC_2310_2320,
  FOOT_CONTROL_ACC_2330,
  POWER_MIC_3,
  POWER_MIC_4,
  SPEECH_MIKE_LFH_35XX,
  SPEECH_MIKE_LFH_36XX,
  SPEECH_MIKE_SMP_37XX,
  SPEECH_MIKE_SMP_38XX,
  SPEECH_MIKE_SMP_40XX,
  SPEECH_ONE_PSM_6000,
  UNKNOWN,
}

export enum ButtonEvent {
  REWIND = 1 << 0,
  PLAY = 1 << 1,
  FORWARD = 1 << 2,
  INS_OVR = 1 << 4,
  RECORD = 1 << 5,
  COMMAND = 1 << 6,
  STOP = 1 << 8,
  INSTR = 1 << 9,
  F1_A = 1 << 10,
  F2_B = 1 << 11,
  F3_C = 1 << 12,
  F4_D = 1 << 13,
  EOL_PRIO = 1 << 14,
  TRANSCRIBE = 1 << 15,
  TAB_BACKWARD = 1 << 16,
  TAB_FORWARD = 1 << 17,
  CUSTOM_LEFT = 1 << 18,
  CUSTOM_RIGHT = 1 << 19,
  ENTER_SELECT = 1 << 20,
  SCAN_END = 1<<21,
  SCAN_SUCCESS = 1<<22,
}

export type ButtonEventListener = (device: DictationDevice, bitMask: number) =>
    void|Promise<void>;

export abstract class DictationDeviceBase {
  private static next_id = 0;

  readonly id = DictationDeviceBase.next_id++;
  abstract readonly implType: ImplementationType;

  protected readonly buttonEventListeners = new Set<ButtonEventListener>();
  protected lastBitMask = 0;

  constructor(readonly hidDevice: HIDDevice) {}

  async init() {
    this.hidDevice.addEventListener(
        'inputreport',
        (event: HIDInputReportEvent) => this.onInputReport(event));

    if (this.hidDevice.opened === false) {
      await this.hidDevice.open();
    }
  }

  async shutdown(closeDevice = true) {
    if (closeDevice) {
      await this.hidDevice.close();
    }

    this.buttonEventListeners.clear();
  }

  addButtonEventListener(listener: ButtonEventListener) {
    this.buttonEventListeners.add(listener);
  }

  protected async onInputReport(event: HIDInputReportEvent) {
    const data = event.data;
    await this.handleButtonPress(data);
  }

  protected async handleButtonPress(data: DataView) {
    const buttonMappings = this.getButtonMappings();
    const inputBitMask = this.getInputBitmask(data);
    let outputBitMask = 0;
    for (const [buttonEvent, buttonMapping] of buttonMappings) {
      if (inputBitMask & buttonMapping) outputBitMask |= buttonEvent;
    }

    if (outputBitMask === this.lastBitMask) return;
    this.lastBitMask = outputBitMask;

    await Promise.all([...this.buttonEventListeners].map(
        listener => listener(this.getThisAsDictationDevice(), outputBitMask)));
  }

  abstract getDeviceType(): DeviceType;
  protected abstract getButtonMappings(): Map<ButtonEvent, number>;
  protected abstract getInputBitmask(data: DataView): number;
  protected abstract getThisAsDictationDevice(): DictationDevice;
}
