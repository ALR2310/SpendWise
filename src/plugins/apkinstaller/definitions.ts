export interface ApkInstallerPlugin {
  install(options: { filePath: string }): Promise<void>;
}
