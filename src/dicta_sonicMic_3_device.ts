import {ButtonEvent, DeviceType, DictationDeviceBase, ImplementationType} from './dictation_device_base';

const BUTTON_MAPPINGS = new Map<ButtonEvent, number>([
  [ButtonEvent.TAB_BACKWARD, 1 << 0],
  // returns "3" in reality, see getInputBitmask
  [ButtonEvent.TAB_FORWARD, 1 << 1],
  [ButtonEvent.PLAY, 1 << 2],
  [ButtonEvent.RECORD, 1 << 8],
  [ButtonEvent.INSTR, 1 << 9],
  [ButtonEvent.CUSTOM_LEFT, 1 << 10],
  [ButtonEvent.F2_B, 1 << 11],
  [ButtonEvent.CUSTOM_RIGHT, 1 << 12],
  [ButtonEvent.F3_C, 1 << 13],
  [ButtonEvent.F1_A, 1 << 15],
  [ButtonEvent.TRANSCRIBE, 1 << 16],
  [ButtonEvent.INS_OVR, 1 << 17],
  [ButtonEvent.ENTER_SELECT, 1 << 22],
]);

export class SonicMic3Device extends DictationDeviceBase {
  readonly implType = ImplementationType.SONICMIC_3;

  static create(hidDevice: HIDDevice) {
    return new SonicMic3Device(hidDevice);
  }

  getDeviceType(): DeviceType {
    return DeviceType.SONICMIC_3;
  }

  protected getButtonMappings(): Map<ButtonEvent, number> {
    return BUTTON_MAPPINGS;
  }

  protected getInputBitmask(data: DataView): number {
    const raw = data.getUint32(4, false);
    // TAB_FORWARD returns value "3", which is "11" in binary.
    // This makes it incompatible for single-bit bitmasking
    // So we return 2 (11) instead & map this in BUTTON_MAPPINGS
    if (raw === 3) return 2;
    return raw;
  }

  protected getThisAsDictationDevice(): SonicMic3Device {
    return this;
  }
}
