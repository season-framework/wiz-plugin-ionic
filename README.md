# WIZ Ionic Plugin

## Todo

- explore에서 Install, add 버튼들 모달로 숨겨버리기
  - 열 때마다 api 콜해서 정신사나움
  - 아니면 toolkit 형태로 ui 컴포넌트 따로 만들어서 우측 하단으로 위치시키기
  - electron plugin도 이러면 될 듯

## Precondition

### Android

- jdk
- android sdk
- adb

in PATH variable

- JAVA_HOME
- ANDROID_HOME

### iOS

> 현재 검증 불가; Signing & Capabilities 에러가 발생하는데 xcode에서도 해결이 안됨. 이 거지같은 iOS 진짜 XX

- idevice_id (`brew install libimobiledevice`)
- `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- `brew install cocoapods`
- download iOS with `https://developer.apple.com/download/all/?q=iOS`
  - `https://developer.apple.com/documentation/xcode/installing-additional-simulator-runtimes`
  - `xcrun simctl runtime add ./iOS_17.4_Simulator_Runtime.dmg`
- ...

## Installation

1. 우측 하단 System Setting > IDE Menu에 아래 내용 추가

```json
{
    "name": "Ionic Explore",
    "id": "ionic.app.explore",
    "icon": "fa-solid fa-mobile-screen",
    "width": 240
},
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
