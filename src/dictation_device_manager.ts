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
import {ButtonEventListener, ImplementationType} from './dictation_device_base';
import {FootControlDevice} from './foot_control_device';
import {PowerMic3Device} from './powermic_3_device';
import {SpeechMikeGamepadDevice} from './speechmike_gamepad_device';
import {
  MotionEventListener,
  SpeechMikeHidDevice,
} from './speechmike_hid_device';

type DeviceEventListener = (device: DictationDevice) => void | Promise<void>;

const DEVICE_FILTERS: Readonly<
  Record<ImplementationType, ReadonlyArray<HIDDeviceFilter>>
> = Object.freeze({
  [ImplementationType.SPEECHMIKE_HID]: Object.freeze([
    // Wired SpeechMikes (LFH35xx, LFH36xx, SMP37xx, SMP38xx) in HID
    // mode
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x0c1c,
      usagePage: 65440,
      usage: 1,
    }),
    // SpeechMike Premium Air (SMP40xx) in HID mode
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x0c1d,
      usagePage: 65440,
      usage: 1,
    }),
    // SpeechOne (PSM6000) in HID mode
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x0c1e,
      usagePage: 65440,
      usage: 1,
    }),
    // All SpeechMikes in Browser/Gamepad mode
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x0fa0,
      usagePage: 65440,
      usage: 1,
    }),
    // PowerMic IV in HID or Browser/Gamepad mode
    Object.freeze({
      vendorId: 0x0554,
      productId: 0x0064,
      usagePage: 65440,
      usage: 1,
    }),
  ]),
  [ImplementationType.SPEECHMIKE_GAMEPAD]: Object.freeze([
    // All SpeechMikes in Browser/Gamepad mode
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x0fa0,
      usagePage: 1,
      usage: 4,
    }),
    // SpeechOne (PSM6000) in Browser/Gamepad mode
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x0c1e,
      usagePage: 1,
      usage: 4,
    }),
    // PowerMic IV in Browser/Gamepad mode
    Object.freeze({
      vendorId: 0x0554,
      productId: 0x0064,
      usagePage: 1,
      usage: 4,
    }),
  ]),
  [ImplementationType.FOOT_CONTROL]: Object.freeze([
    // 3-pedal Foot control ACC2310/2320
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x1844,
      usagePage: 1,
      usage: 4,
    }),
    // 4-pedal Foot control ACC2330
    Object.freeze({
      vendorId: 0x0911,
      productId: 0x091a,
      usagePage: 1,
      usage: 4,
    }),
  ]),
  [ImplementationType.POWERMIC_3]: Object.freeze([
    // PowerMic III
    Object.freeze({
      vendorId: 0x0554,
      productId: 0x1001,
      usagePage: 1,
      usage: 0,
    }),
  ]),
});

export class DictationDeviceManager {
  protected readonly buttonEventListeners = new Set<ButtonEventListener>();
  protected readonly deviceConnectEventListeners =
    new Set<DeviceEventListener>();
  protected readonly deviceDisconnectEventListeners =
    new Set<DeviceEventListener>();
  protected readonly motionEventListeners = new Set<MotionEventListener>();

  protected readonly devices = new Map<HIDDevice, DictationDevice>();

  getDevices(): DictationDevice[] {
    return [...this.devices.values()];
  }

  async init() {
    navigator.hid.addEventListener('connect', (event: HIDConnectionEvent) =>
      this.onHidDeviceConnected(event)
    );
    navigator.hid.addEventListener('disconnect', (event: HIDConnectionEvent) =>
      this.onHidDeviceDisconnected(event)
    );

    const hidDevices = await navigator.hid.getDevices();
    await this.createAndAddInitializedDevices(hidDevices);
  }

  async shutdown() {
    await Promise.all([
      [...this.devices.values()].map(device =>
        device.shutdown(/*closeDevice=*/ true)
      ),
    ]);
    this.devices.clear();
  }

  async requestDevice(): Promise<Array<DictationDevice>> {
    const hidDevices = await navigator.hid.requestDevice({
      filters: getFilters(),
    });
    const devices = await this.createAndAddInitializedDevices(hidDevices);
    return devices;
  }

  addButtonEventListener(listener: ButtonEventListener) {
    this.buttonEventListeners.add(listener);
  }

  addDeviceConnectedEventListener(listener: DeviceEventListener) {
    this.deviceConnectEventListeners.add(listener);
  }

  addDeviceDisconnectedEventListener(listener: DeviceEventListener) {
    this.deviceDisconnectEventListeners.add(listener);
  }

  addMotionEventListener(listener: MotionEventListener) {
    this.motionEventListeners.add(listener);
  }

  protected async createAndAddInitializedDevices(
    hidDevices: HIDDevice[]
  ): Promise<Array<DictationDevice>> {
    const devices = await Promise.all(
      hidDevices.map(hidDevice => this.createDevice(hidDevice))
    );

    const filteredDevices = devices.filter(isDevice);
    if (filteredDevices.length === 0) return [];

    const proxyDevices: SpeechMikeGamepadDevice[] = [];
    const hostDevices: DictationDevice[] = [];
    for (const device of filteredDevices) {
      if (device === undefined) continue;
      if (device.implType === ImplementationType.SPEECHMIKE_GAMEPAD) {
        proxyDevices.push(device);
      } else {
        hostDevices.push(device);
      }
    }

    for (const device of hostDevices) {
      this.addListeners(device);
      this.devices.set(device.hidDevice, device);
    }

    await Promise.all(filteredDevices.map(device => device.init()));

    if (proxyDevices.length === 0) return hostDevices;
    for (const proxyDevice of proxyDevices) {
      // Find matching host and assign
      const proxyHidDevice = proxyDevice.hidDevice;
      let assigned = false;
      for (const hostDevice of this.devices.values()) {
        if (hostDevice.implType !== ImplementationType.SPEECHMIKE_HID) {
          continue;
        }
        const hostHidDevice = hostDevice.hidDevice;
        if (
          proxyHidDevice.vendorId !== hostHidDevice.vendorId ||
          proxyHidDevice.productId !== hostHidDevice.productId
        ) {
          continue;
        }
        hostDevice.assignProxyDevice(proxyDevice);
        assigned = true;
        break;
      }
      if (!assigned) {
        throw new Error('Could not assign proxy device');
      }
    }

    return hostDevices;
  }

  protected async createDevice(
    hidDevice: HIDDevice
  ): Promise<DictationDevice | undefined> {
    const implType = getImplType(hidDevice);
    if (implType === undefined) return undefined;
    switch (implType) {
      case ImplementationType.SPEECHMIKE_HID:
        return new SpeechMikeHidDevice(hidDevice);
      case ImplementationType.POWERMIC_3:
        return new PowerMic3Device(hidDevice);
      case ImplementationType.SPEECHMIKE_GAMEPAD:
        return new SpeechMikeGamepadDevice(hidDevice);
      case ImplementationType.FOOT_CONTROL:
        return new FootControlDevice(hidDevice);
      default:
        checkExhaustive(implType);
    }
  }

  protected addListeners(device: DictationDevice) {
    for (const listener of this.buttonEventListeners) {
      device.addButtonEventListener(listener);
    }

    if (device.implType === ImplementationType.SPEECHMIKE_HID) {
      for (const listener of this.motionEventListeners) {
        device.addMotionEventListener(listener);
      }
    }
  }

  protected async onHidDeviceConnected(event: HIDConnectionEvent) {
    const hidDevice = event.device;
    const devices = await this.createAndAddInitializedDevices([hidDevice]);
    const device = devices[0];
    if (device === undefined) return;

    await Promise.all(
      [...this.deviceConnectEventListeners].map(listener => listener(device))
    );
  }

  protected async onHidDeviceDisconnected(event: HIDConnectionEvent) {
    const hidDevice = event.device;
    const device = this.devices.get(hidDevice);
    if (device === undefined) return;

    await device.shutdown(/*closeDevice=*/ false);

    await Promise.all(
      [...this.deviceDisconnectEventListeners].map(listener => listener(device))
    );

    this.devices.delete(hidDevice);
  }
}

function getFilters(): HIDDeviceFilter[] {
  const filters: HIDDeviceFilter[] = [];
  for (const implType of Object.values(ImplementationType)) {
    if (typeof implType === 'string') continue;
    const filtersForImplType = DEVICE_FILTERS[implType];
    filters.push(...filtersForImplType);
  }
  return filters;
}

function getImplType(hidDevice: HIDDevice): ImplementationType | undefined {
  for (const implType of Object.values(ImplementationType)) {
    if (typeof implType === 'string') continue;
    const filtersForImplType = DEVICE_FILTERS[implType];
    if (deviceMatchesFilters(hidDevice, filtersForImplType)) return implType;
  }
  return undefined;
}

function deviceMatchesFilters(
  hidDevice: HIDDevice,
  filters: ReadonlyArray<HIDDeviceFilter>
): boolean {
  return filters.some(filter => deviceMatchesFilter(hidDevice, filter));
}

function deviceMatchesFilter(
  hidDevice: HIDDevice,
  filter: Readonly<HIDDeviceFilter>
): boolean {
  if (filter.vendorId !== undefined && hidDevice.vendorId !== filter.vendorId)
    return false;
  if (
    filter.productId !== undefined &&
    hidDevice.productId !== filter.productId
  )
    return false;

  if (filter.usagePage !== undefined) {
    if (
      hidDevice.collections === undefined ||
      hidDevice.collections.every(
        collection => collection.usagePage !== filter.usagePage
      )
    ) {
      return false;
    }
  }

  if (filter.usage !== undefined) {
    if (
      hidDevice.collections === undefined ||
      hidDevice.collections.every(
        collection => collection.usage !== filter.usage
      )
    ) {
      return false;
    }
  }

  return true;
}

function checkExhaustive(arg: never): never {
  throw new Error(`Unexpected input: ${arg}`);
}

function isDevice(
  device: DictationDevice | undefined
): device is DictationDevice {
  return device !== undefined;
}
