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
import {
  ButtonEvent as ButtonEvent_,
  DeviceType as DeviceType_,
  ImplementationType as ImplementationType_,
} from './dictation_device_base';
import {DictationDeviceManager as DictationDeviceManager_} from './dictation_device_manager';
import {FootControlDevice as FootControlDevice_} from './foot_control_device';
import {
  LedStatePM3 as LedStatePM3_,
  PowerMic3Device as PowerMic3Device_,
} from './powermic_3_device';
import {SpeechMikeGamepadDevice as SpeechMikeGamepadDevice_} from './speechmike_gamepad_device';
import {
  EventMode as EventMode_,
  LedIndex as LedIndex_,
  LedMode as LedMode_,
  MotionEvent as MotionEvent_,
  SimpleLedState as SimpleLedState_,
} from './speechmike_hid_device';

export namespace DictationSupport {
  // dictation_device_base.ts
  export const ImplementationType = ImplementationType_;
  export const DeviceType = DeviceType_;
  export const ButtonEvent = ButtonEvent_;

  // dictation_device_manager.ts
  export const DictationDeviceManager = DictationDeviceManager_;

  // foot_control_device.ts
  export const FootControlDevice = FootControlDevice_;

  // powermic_3_device.ts
  export const LedStatePM3 = LedStatePM3_;
  export const PowerMic3Device = PowerMic3Device_;

  // speechmike_gamepad_device.ts
  export const SpeechMikeGamepadDevice = SpeechMikeGamepadDevice_;

  // speechmike_hid_device.ts
  export const EventMode = EventMode_;
  export const SimpleLedState = SimpleLedState_;
  export const LedIndex = LedIndex_;
  export const LedMode = LedMode_;
  export const MotionEvent = MotionEvent_;
}
