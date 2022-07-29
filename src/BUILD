load("//tools/build_defs/js:rules.bzl", "js_binary")
load("//javascript/typescript:build_defs.bzl", "ts_config", "ts_library")

ts_library(
    name = "sdk_lib",
    srcs = [
        "dictation_device.ts",
        "dictation_device_base.ts",
        "dictation_device_manager.ts",
        "foot_control_device.ts",
        "index.ts",
        "power_mic_3_device.ts",
        "speech_mike_gamepad_device.ts",
        "speech_mike_hid_device.ts",
    ],
    deps = [
        "//javascript/closure:base",
        "//third_party/javascript/typings/w3c_web_hid",
    ],
)

js_binary(
    name = "sdk",
    deps = [":sdk_lib"],
)

ts_config(
    name = "tsconfig",
    deps = [
        ":sdk",
        ":sdk_lib",
    ],
)