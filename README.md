
#  Dictation support SDK



##  Features
The SDK provided with this repository allows web-based apps/pages to interact with dictation devices:
* Events for connected / disconnected devices
* Events for button presses
* Events for motion events (pickedup and layed down)
* Commands to set LED states (predefined states or individual LED settings)

### Demo website
You can test out the SDK capabilities with a supported device using this [demo website](https://storage.googleapis.com/chromeos-mgmt-public-extension/dictation_support/index.html).

TODO: host latest release and link here

###  Supported devices
* Philips
  * SpeechMike LFH
    * 3500
    * 3510
    * 3520
    * 3600
    * 3610
   * SpeechMike SMP
     * 3700
     * 3710
     * 3720
     * 3800
     * 3810
     * 4000
     * 4010
    * SpeechOne PSM 6000
* Nuance
  * PowerMic 3
  * PowerMic 4

##  How to use

###  Code sample
TODO: provide link to built sdk.js from latest release

To use the SDK, simply include the compiled `sdk.js` into your web page/app and create an instance of `DictationSupport.DictationDeviceManager`. See [/example/index.ejs](https://github.com/GoogleChromeLabs/dictation_support/blob/main/example/index.ejs) or the resulting `/dist/index.html` for an example.

###  WebHID permission / policy
The SDK requires permission to interact with the device using the [WebHID API](https://wicg.github.io/webhid/). This can happen two different ways:

#### User grants permission
You can use `await deviceManager.requestDevice()`, which will prompt the user to select one of the supported devices from a pop-up. Once the user has granted permission, the device will be available, i.e. a new `DictationDevice` will be created. That device will also be available via `deviceManger.getDevices()` when the page reloads. Disconnecting and reconnecting the device will require the user to grant permission again using `deviceManager.requestDevice()`.

#### Admin grants permission
TODO(Google): surface [WebHidAllowAllDevicesForUrls](https://chromeenterprise.google/policies/#WebHidAllowAllDevicesForUrls) to the admin console

Instead of the user being prompted to grant permissions, the admin can also grant permissions upfront.

On the [Google admin console](https://admin.google.com), navigate to the user or managed guest session policy page and search for `WebHidAllowAllDevicesForUrls`. With this setting, you can allowlist certain devices (vendor ID & product ID)  to the URLs you want to use the SDK on.
Note: The Philips SpeechMikes have different product IDs depending on the event mode (HID vs browser/gamepad mode), see [/src/device_manager.ts](https://github.com/GoogleChromeLabs/dictation_support/blob/main/src/dictation_device_manager.ts) for a list of supported product and vendor IDs (in hex format) in various modes. The product and vendor ID for the policy have to be provided in decimal representation.

If the device is granted permission via policy, the device will be available to the SDK immediately when it is connected (also firing an event).

##  Developer instructions

##  Installation
In order to get started developing, run `npm install` to install the required dependencies.

##  Build
To build the SDK, run `npm run build`, which will create the following set of files
* `/dist/sdk.js` the SDK you need to include
* `/dist/index.d.ts` Typescript typings for the SDK
* `/dist/index.html` sample page using the SDK

## Contributing
Feel free to send pull-requests! All code changes must be:
* approved by a project maintainer
* properly formatted (use `npm run format`)
* pass linting (use `npm run lint`)
* TODO: pass tests (use `npm test`)

