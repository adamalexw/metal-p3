const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withReanimatedBypass(config) {
  return withProjectBuildGradle(config, async (config) => {
    const bypassCode = `
allprojects {
    gradle.projectsEvaluated {
        def reanimatedProject = project.findProject(":react-native-reanimated")
        if (reanimatedProject != null) {
            def task = reanimatedProject.tasks.findByName("assertMinimalReactNativeVersionTask")
            if (task != null) {
                task.enabled = false
            }
        }
        
        def workletsProject = project.findProject(":react-native-worklets")
        if (workletsProject != null) {
            def task = workletsProject.tasks.findByName("assertMinimalReactNativeVersionTask")
            if (task != null) {
                task.enabled = false
            }
        }
    }
}
`;
    
    if (!config.modResults.contents.includes('assertMinimalReactNativeVersionTask')) {
      config.modResults.contents += '\n' + bypassCode;
    }
    return config;
  });
};
