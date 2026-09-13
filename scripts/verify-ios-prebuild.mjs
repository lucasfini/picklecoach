import { readFileSync } from 'node:fs';

const paths = {
  appIcon:
    'ios/PickleCoach/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
  bundleProject: 'ios/PickleCoach.xcodeproj/project.pbxproj',
  constantsPodspec: 'node_modules/expo-constants/ios/EXConstants.podspec',
  infoPlist: 'ios/PickleCoach/Info.plist',
  reactNativePodHelper: 'node_modules/react-native/scripts/cocoapods/new_architecture.rb',
  splash3x: 'ios/PickleCoach/Images.xcassets/SplashScreenLogo.imageset/image@3x.png',
};

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readUtf8(path) {
  return readFileSync(path, 'utf8');
}

function inspectPng(path) {
  const bytes = readFileSync(path);
  const pngSignature = '89504e470d0a1a0a';

  invariant(bytes.subarray(0, 8).toString('hex') === pngSignature, `${path} is not a PNG.`);

  const colorType = bytes[25];
  return {
    hasAlpha: colorType === 4 || colorType === 6,
    height: bytes.readUInt32BE(20),
    width: bytes.readUInt32BE(16),
  };
}

const appIcon = inspectPng(paths.appIcon);
invariant(appIcon.width === 1024 && appIcon.height === 1024, 'The iOS app icon must be 1024 px.');
invariant(!appIcon.hasAlpha, 'The iOS app icon must be opaque.');

const splash3x = inspectPng(paths.splash3x);
invariant(splash3x.width === 570 && splash3x.height === 570, 'The 3x splash mark must be 570 px.');
invariant(splash3x.hasAlpha, 'The splash mark must preserve transparency.');

const project = readUtf8(paths.bundleProject);
invariant(
  (project.match(/TARGETED_DEVICE_FAMILY = "1";/g) ?? []).length >= 2,
  'The unvalidated iPad target must remain disabled.',
);
invariant(
  project.includes('REACT_NATIVE_XCODE_SCRIPT=\\"$(\\"$NODE_BINARY\\" --print'),
  'The generated React Native bundle phase is not path-safe.',
);
invariant(
  project.includes('\\"$REACT_NATIVE_XCODE_SCRIPT\\"'),
  'The generated React Native bundle phase does not quote the resolved script path.',
);

const constantsPodspec = readUtf8(paths.constantsPodspec);
invariant(
  constantsPodspec.includes('\\\\\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\\\\"'),
  'The expo-constants path-safety patch is missing.',
);

const reactNativePodHelper = readUtf8(paths.reactNativePodHelper);
invariant(
  reactNativePodHelper.includes('find "#{projectFolderPath}" -name "Info.plist"'),
  'The React Native Info.plist path-safety patch is missing.',
);

const infoPlist = readUtf8(paths.infoPlist);
for (const requiredKey of [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
]) {
  invariant(infoPlist.includes(`<key>${requiredKey}</key>`), `${requiredKey} is missing from Info.plist.`);
}
invariant(
  !infoPlist.includes('<key>NSMicrophoneUsageDescription</key>'),
  'Silent practice capture must not declare microphone access.',
);
invariant(
  infoPlist.includes('<key>ITSAppUsesNonExemptEncryption</key>\n    <false/>'),
  'The export-compliance declaration must match the app’s lack of non-exempt encryption.',
);

console.log('iOS prebuild contract verified: iPhone target, icon, splash, camera/photo-only permissions, export compliance, and path-safe scripts.');
