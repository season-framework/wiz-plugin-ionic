# WIZ Ionic Plugin

## Precondition

### Android

- jdk
- android sdk
- adb

in PATH variable

- JAVA_HOME
- ANDROID_HOME

### iOS

> 현재 검증 불가; Signing & Capabilities 에러가 발생하는데 xcode에서도 해결이 안됨. 이 거지같은 iOS 진짜...

```
error: No profiles for 'io.ionic.starter' were found:
        Xcode couldn't find any iOS App Development provisioning profiles matching 'io.ionic.starter'. Automatic signing
        is disabled and unable to generate a profile. To enable automatic signing, pass -allowProvisioningUpdates to
        xcodebuild. (in target 'App' from project 'App')
```

- 개발자 모드 ON
- idevice_id (`brew install libimobiledevice`)
- `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- `brew install cocoapods`
- download iOS with `https://developer.apple.com/download/all/?q=iOS`
  - `https://developer.apple.com/documentation/xcode/installing-additional-simulator-runtimes`
  - `xcrun simctl runtime add ./iOS_17.4_Simulator_Runtime.dmg`
- ...

## Installation

1. 우측 하단 System Setting > IDE Menu에 아래 내용 추가

> main

```json
{
    "name": "Ionic Explore",
    "id": "ionic.app.explore",
    "icon": "fa-solid fa-mobile-screen",
    "width": 240
}
```

> sub

```json
{
    "name": "Ionic Toolkit",
    "id": "ionic.app.toolkit",
    "icon": "fa-solid fa-mobile-screen",
    "width": 300
}
```

2. Ionic Explore > rebuild 실행

3. Add Android Integration or Add iOS Integration

- `@capacitor/android`
- `@capacitor/ios`

4. Ionic Explore > angular > package.json 내용 확인

- `scripts`
  - `ionic:android`
  - `ionic:ios`

- `dependencies`
  - `@capacitor/android`
  - `@capacitor/ios`
  - `@capacitor/app`
  - `@capacitor/camera`
  - `@capacitor/core`
  - `@capacitor/filesystem`
  - `@capacitor/haptics`
  - `@capacitor/keyboard`
  - `@capacitor/preferences`
  - `@capacitor/status-bar`
  - `@ionic/angular`
  - `@ionic/pwa-elements`
  - `ionicons`

- `devDependencies`
  - `@capacitor/cli`
  - `@ionic/angular-toolkit`

5. select device and click Install button
