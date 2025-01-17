import {
  convertNxGenerator,
  formatFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  normalizePath,
  Tree,
  generateFiles,
  updateProjectConfiguration,
  readProjectConfiguration,
  offsetFromRoot,
  addDependenciesToPackageJson,
} from '@nrwl/devkit';
import { Schema } from './schema';
import { applicationGenerator as nxApplicationGenerator } from '@nrwl/react';

export async function applicationGenerator(tree: Tree, options: Schema) {
  const appDirectory = options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');

  const { appsDir } = getWorkspaceLayout(tree);
  const appProjectRoot = normalizePath(`${appsDir}/${appDirectory}`);

  await (
    await nxApplicationGenerator(tree, {
      ...options,
      e2eTestRunner: 'none',
    })
  )();

  tree.delete(joinPathFragments(appProjectRoot, 'tsconfig.app.json'));
  tree.delete(joinPathFragments(appProjectRoot, 'tsconfig.spec.json'));
  tree.delete(joinPathFragments(appProjectRoot, 'tsconfig.json'));
  tree.delete(joinPathFragments(appProjectRoot, 'src', 'index.html'));
  tree.delete(
    joinPathFragments(
      appProjectRoot,
      'src',
      'app',
      `nx-welcome.${options.js ? 'jsx' : 'tsx'}`
    )
  );
  const fileName = options.pascalCaseFiles ? 'App' : 'app';
  tree.delete(
    joinPathFragments(
      appProjectRoot,
      'src',
      'app',
      `${fileName}.${options.js ? 'jsx' : 'tsx'}`
    )
  );
  const projectConfig = readProjectConfiguration(tree, appProjectName);
  updateProjectConfiguration(tree, appProjectName, {
    ...projectConfig,
    targets: {
      ...projectConfig.targets,
      build: {
        ...projectConfig.targets.build,
        executor: '@nxext/vite:build',
        outputs: ['{options.outputPath}'],
        defaultConfiguration: 'production',
        options: {
          outputPath: joinPathFragments('dist', appProjectRoot),
          baseHref: '/',
          configFile: '@nxext/vite/plugins/vite',
          frameworkConfigFile: '@nxext/react/plugins/vite',
        },
      },
      serve: {
        ...projectConfig.targets.serve,
        executor: '@nxext/vite:dev',
        options: {
          outputPath: joinPathFragments('dist', appProjectRoot),
          baseHref: '/',
          configFile: '@nxext/vite/plugins/vite',
          frameworkConfigFile: '@nxext/react/plugins/vite',
        },
      },
    },
  });
  const templateVariables = {
    ...names(options.name),
    ...options,
    tmpl: '',
    offsetFromRoot: offsetFromRoot(appProjectRoot),
    projectName: appProjectName,
    fileName: fileName,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    appProjectRoot,
    templateVariables
  );
  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@vitejs/plugin-react': '^1.1.0',
    }
  );
  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
