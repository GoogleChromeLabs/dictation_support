import {ButtonEvent, DeviceType, ImplementationType} from './dictation_device_base';
import {RM4010NDevice} from './rm_4010n_device';
import {MotionEvent} from './speechmike_hid_device';
import {ButtonMappingTestCase, checkButtonMapping} from './test_util/check_button_mapping';
import {cleanState} from './test_util/clean_state';
import {FakeHidDevice} from './test_util/fake_hid_device';

describe('RM4010NDevice', () => {
  const state = cleanState<{
    buttonEventListener: jasmine.Spy,
    motionEventListener: jasmine.Spy,
    dictationDevice: RM4010NDevice,
    fakeHidDevice: FakeHidDevice,
  }>();

  beforeEach(async () => {
    state.buttonEventListener = jasmine.createSpy('buttonEventListener');
    state.motionEventListener = jasmine.createSpy('motionEventListener');

    state.fakeHidDevice =
        new FakeHidDevice({productId: 0x0297, vendorId: 0x33a2});
    state.dictationDevice = RM4010NDevice.create(state.fakeHidDevice);
    state.dictationDevice.addButtonEventListener(state.buttonEventListener);
    state.dictationDevice.addMotionEventListener(state.motionEventListener);
    await state.dictationDevice.init();
  });

  it('creates the right device type', async () => {
    expect(state.dictationDevice.getDeviceType()).toBe(DeviceType.RM_4010N);
    expect(state.dictationDevice.implType).toBe(ImplementationType.RM_4010N);
  });

  it('handles input reports', async () => {
    const testCases: ButtonMappingTestCase[] = [
      {inputReportData: [0, 0, 0, 0], expectedButtonEvents: undefined},
      {inputReportData: [4, 0, 0, 0], expectedButtonEvents: ButtonEvent.REWIND},
      {inputReportData: [2, 0, 0, 0], expectedButtonEvents: ButtonEvent.PLAY},
      {
        inputReportData: [8, 0, 0, 0],
        expectedButtonEvents: ButtonEvent.FORWARD
      },
      {
        inputReportData: [16, 0, 0, 0],
        expectedButtonEvents: ButtonEvent.RECORD
      },
      {inputReportData: [64, 0, 0, 0], expectedButtonEvents: ButtonEvent.INSTR},
      {
        inputReportData: [0, 4, 0, 0],
        expectedButtonEvents: ButtonEvent.COMMAND
      },
      {inputReportData: [0, 64, 0, 0], expectedButtonEvents: ButtonEvent.F1_A},
      {inputReportData: [0, 128, 0, 0], expectedButtonEvents: ButtonEvent.F2_B},
      {inputReportData: [0, 0, 8, 0], expectedButtonEvents: ButtonEvent.F3_C},
      {
        inputReportData: [0, 0, 16, 0],
        expectedButtonEvents: ButtonEvent.MOUSE_LEFT
      },
      {
        inputReportData: [0, 0, 32, 0],
        expectedButtonEvents: ButtonEvent.MOUSE_RIGHT
      },
      {inputReportData: [0, 0, 64, 0], expectedButtonEvents: ButtonEvent.F4_D},
      {
        inputReportData: [0, 0, 128, 0],
        expectedButtonEvents: ButtonEvent.MOUSE_LEFT
      },
      {
        inputReportData: [0, 0, 0, 1],
        expectedButtonEvents: ButtonEvent.INS_OVR
      },
      {
        inputReportData: [0, 0, 0, 32],
        expectedButtonEvents: ButtonEvent.MOUSE_CENTER
      },
      {inputReportData: [0, 0, 0, 0], expectedButtonEvents: undefined},
    ];
    const resetButtonInputReport = [0, 0, 0, 0];
    await checkButtonMapping(
        state.fakeHidDevice, state.dictationDevice, state.buttonEventListener,
        testCases, resetButtonInputReport);
  });

  it('handles motion events', async () => {
    const motionReportBase = [
      0, 0, 0, 0,  // bytes 0-3 (button area, all zeros for motion events)
      0x03,        // byte 4
      0,           // byte 5
      0,           // byte 6
      0x06,        // byte 7
      0xd0,        // byte 8
      0x19,        // byte 9
    ];

    // Pick up (byte 10 = 0x01)
    state.motionEventListener.calls.reset();
    await state.fakeHidDevice.handleInputReport([...motionReportBase, 0x01]);
    expect(state.motionEventListener)
        .toHaveBeenCalledOnceWith(state.dictationDevice, MotionEvent.PICKED_UP);
    expect(state.buttonEventListener).not.toHaveBeenCalled();
    state.motionEventListener.calls.reset();

    // Put down (byte 10 = 0x00)
    state.motionEventListener.calls.reset();
    await state.fakeHidDevice.handleInputReport([...motionReportBase, 0x00]);
    expect(state.motionEventListener)
        .toHaveBeenCalledOnceWith(
            state.dictationDevice, MotionEvent.LAYED_DOWN);
    expect(state.buttonEventListener).not.toHaveBeenCalled();
  });

  it('does not fire motion event for non-matching data', async () => {
    // Data that does not match the motion event signature
    await state.fakeHidDevice.handleInputReport(
        [0, 0, 0, 0, 0x01, 0, 0, 0x06, 0xd0, 0x19, 0x01]);
    expect(state.motionEventListener).not.toHaveBeenCalled();
  });
});
