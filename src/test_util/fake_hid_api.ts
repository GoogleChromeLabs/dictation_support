import {FakeHidDevice} from './fake_hid_device';

type DeviceEventListener = (event: HIDConnectionEvent) => void|Promise<void>;

export class FakeHidApi implements HID {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  onconnect: ((this: this, ev: Event) => any)|null = null;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  ondisconnect: ((this: this, ev: Event) => any)|null = null;

  protected readonly connectListeners = new Set<DeviceEventListener>();
  protected readonly disconnectListeners = new Set<DeviceEventListener>();

  // `devices` are the devices already available via API (i.e. permission
  // already granted via requestDevice() or admin-policy), while
  // `pendingDevices` contains connected devices that haven't been granted
  // access to yet (requires call of `requestDevice()`).
  protected readonly devices = new Set<FakeHidDevice>();
  protected readonly pendingDevices = new Set<FakeHidDevice>();

  getDevices(): Promise<HIDDevice[]> {
    return Promise.resolve(Array.from(this.devices as unknown as HIDDevice[]));
  }

  requestDevice(_options?: HIDDeviceRequestOptions): Promise<HIDDevice[]> {
    // We ignore the filters in options here. Checking them is done by spying on
    // requestDevice(). We simply move all pending devices to added devices.
    const result: FakeHidDevice[] = [];
    for (const pendingDevice of Array.from(this.pendingDevices)) {
      this.devices.add(pendingDevice);
      result.push(pendingDevice);
    }
    this.pendingDevices.clear();
    return Promise.resolve(result as HIDDevice[]);
  }
  addEventListener(
      type: 'connect'|'disconnect',
      listener: (this: this, ev: HIDConnectionEvent) => any,
      options?: boolean,
      ): void;
  addEventListener(
      type?: string,
      listener?: EventListenerOrEventListenerObject|null|
      ((this: this, ev: HIDConnectionEvent) => any),
      options?: boolean|AddEventListenerOptions,
      ): void;
  addEventListener(
      type: 'connect'|'disconnect', listener: DeviceEventListener) {
    if (type === 'connect') {
      this.connectListeners.add(
          listener as ((this: this, ev: HIDConnectionEvent) => any));
    } else {
      this.disconnectListeners.add(
          listener as ((this: this, ev: HIDConnectionEvent) => any));
    }
  }

  removeEventListener(
      type: 'connect'|'disconnect',
      callback: (this: this, ev: HIDConnectionEvent) => any,
      useCapture?: boolean,
      ): void;
  removeEventListener(
      type: string,
      callback: EventListenerOrEventListenerObject|null|
      ((this: this, ev: HIDConnectionEvent) => any),
      options?: EventListenerOptions|boolean,
      ): void;
  removeEventListener(
      type: 'connect'|'disconnect', listener: DeviceEventListener,
      options?: boolean|EventListenerOptions) {
    if (options === undefined) {
      // dummy
    }
    if (type === 'connect') {
      this.connectListeners.delete(
          listener as ((this: this, ev: HIDConnectionEvent) => any));
    } else {
      this.disconnectListeners.delete(
          listener as ((this: this, ev: HIDConnectionEvent) => any));
    }
  }

  dispatchEvent(_event: Event): boolean {
    throw new Error('Not implemented');
  }

  async connectDevice(device: FakeHidDevice, isPending = false) {
    if (isPending) {
      this.pendingDevices.add(device);
    } else {
      this.devices.add(device);
      const event: HIDConnectionEvent = {device} as unknown as
          HIDConnectionEvent;
      await Promise.all(
          [...this.connectListeners].map(listener => listener(event)));
    }
  }

  async disconnectDevice(device: FakeHidDevice) {
    this.pendingDevices.delete(device);
    const wasAdded = this.devices.delete(device);
    if (!wasAdded) return;
    const event: HIDConnectionEvent = {device} as unknown as HIDConnectionEvent;
    await Promise.all(
        [...this.disconnectListeners].map(listener => listener(event)));
  }
}
