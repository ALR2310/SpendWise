import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.resolve(__dirname, '../src/assets/imgs');
const outputFile = path.resolve(__dirname, '../src/assets/index.ts');

const toVariableName = (subDir: string, fileName: string) => {
  let baseName = path.basename(fileName, path.extname(fileName));
  baseName = baseName.replace(/[-\s]/g, '_');
  baseName = baseName.replace(/[^a-zA-Z0-9_]/g, '');

  if (subDir) {
    const dirName = subDir.replace('/', '');
    return `${dirName}_${baseName}`;
  }
  return baseName;
};

const getAllFiles = (
  dir: string,
  subDir = '',
): { varName: string; filePath: string; key: string; subDir: string }[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getAllFiles(fullPath, `${subDir}${entry.name}/`);
    }
    if (/\.(png|jpg|jpeg|svg|gif)$/.test(entry.name)) {
      const baseName = path.basename(entry.name, path.extname(entry.name));
      return {
        varName: toVariableName(subDir, entry.name),
        filePath: `~/assets/imgs/${subDir}${entry.name}`,
        key: baseName,
        subDir: subDir,
      };
    }
    return [];
  });
};

const createImageObject = (files: { varName: string; key: string; subDir: string }[]) => {
  const imageStructure: { [key: string]: any } = {};

  files.forEach(({ varName, key, subDir }) => {
    if (!subDir) {
      imageStructure[key] = varName;
    } else {
      const subDirName = subDir.replace('/', '');
      if (!imageStructure[subDirName]) {
        imageStructure[subDirName] = {};
      }
      imageStructure[subDirName][key] = varName;
    }
  });

  const formatObject = (obj: { [key: string]: any }, indent = 2) => {
    const lines: any[] = [];
    const entries = Object.entries(obj);
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      if (typeof value === 'object') {
        lines.push(`${' '.repeat(indent)}${key}: {`);
        lines.push(formatObject(value, indent + 2));
        lines.push(`${' '.repeat(indent)}}${isLast ? '' : ','}`);
      } else {
        lines.push(`${' '.repeat(indent)}${key}: ${value}${isLast ? '' : ','}`);
      }
    });
    return lines.join('\n');
  };

  return `export const appImages = {\n${formatObject(imageStructure)}\n};`;
};

if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
}

const imageFiles = getAllFiles(assetsDir);

const imports = imageFiles.map(({ varName, filePath }) => `import ${varName} from '${filePath}';`).join('\n');

const imageObject = createImageObject(imageFiles);

const content = `${imports}\n\n${imageObject}\n`;
fs.writeFileSync(outputFile, content, 'utf8');

console.log(`✅ Generated ${outputFile} with ${imageFiles.length} images.`);
