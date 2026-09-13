const { withXcodeProject } = require('@expo/config-plugins');

const PHASE_NAME = 'Bundle React Native code and images';
const BROKEN_INVOCATION =
  '`"$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'"`';
const SCRIPT_PATH_ASSIGNMENT =
  'REACT_NATIVE_XCODE_SCRIPT="$("$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'")"';
const SAFE_INVOCATION = `${SCRIPT_PATH_ASSIGNMENT}\n"$REACT_NATIVE_XCODE_SCRIPT"`;

function parseBuildPhaseScript(value) {
  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function withPathSafeIosBuildScripts(config) {
  return withXcodeProject(config, (modConfig) => {
    const phases = modConfig.modResults.hash.project.objects.PBXShellScriptBuildPhase;
    let foundBundlePhase = false;

    for (const [key, phase] of Object.entries(phases)) {
      if (key.endsWith('_comment') || typeof phase !== 'object' || phase === null) {
        continue;
      }

      const normalizedName = String(phase.name ?? '').replaceAll('"', '');
      if (normalizedName !== PHASE_NAME) {
        continue;
      }

      foundBundlePhase = true;
      const script = parseBuildPhaseScript(phase.shellScript);
      if (script === null) {
        throw new Error(`Could not parse the ${PHASE_NAME} Xcode build phase.`);
      }

      if (script.includes(SAFE_INVOCATION)) {
        continue;
      }

      if (!script.includes(BROKEN_INVOCATION)) {
        throw new Error(
          `${PHASE_NAME} changed upstream; review the path-safety compatibility plugin.`,
        );
      }

      phase.shellScript = JSON.stringify(script.replace(BROKEN_INVOCATION, SAFE_INVOCATION));
    }

    if (!foundBundlePhase) {
      throw new Error(`Could not find the ${PHASE_NAME} Xcode build phase.`);
    }

    return modConfig;
  });
}

module.exports = withPathSafeIosBuildScripts;
