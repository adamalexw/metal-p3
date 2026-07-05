const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withWindowsMemoryLimits(config) {
  return withGradleProperties(config, (config) => {
    // Modify org.gradle.jvmargs
    const jvmArgsItem = config.modResults.find(item => item.type === 'property' && item.key === 'org.gradle.jvmargs');
    if (jvmArgsItem) {
      jvmArgsItem.value = '-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8';
    } else {
      config.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx4g -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8' });
    }

    // Disable parallel and limit workers
    const setOrAdd = (key, value) => {
      const item = config.modResults.find(i => i.type === 'property' && i.key === key);
      if (item) {
        item.value = value;
      } else {
        config.modResults.push({ type: 'property', key, value });
      }
    };

    setOrAdd('org.gradle.parallel', 'false');
    setOrAdd('org.gradle.workers.max', '2');
    setOrAdd('kotlin.daemon.jvmargs', '-Xmx2g -XX:MaxMetaspaceSize=512m');
    setOrAdd('kotlin.compiler.execution.strategy', 'daemon');
    setOrAdd('reactNativeArchitectures', 'arm64-v8a');

    return config;
  });
};
