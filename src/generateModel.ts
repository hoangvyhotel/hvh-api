import fs from 'fs';
import path from 'path';

function mapMongoTypeToMongoose(type: string) {
  switch (type) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'object': return 'Object';
    case 'objectId': return 'Schema.Types.ObjectId';
    case 'date': return 'Date';
    default: return 'Schema.Types.Mixed';
  }
}

function mapMongoTypeToTypeScript(type: string) {
  switch (type) {
    case 'objectId': return 'string';
    case 'date': return 'Date';
    default: return type;
  }
}

export default function generateModelFile(collectionName: string, schema: { [key: string]: string }) {
  const modelName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
  const interfaceName = `I${modelName}`;

  // Interface TypeScript
  let interfaceContent = `export interface ${interfaceName} {\n`;
  Object.keys(schema).forEach(key => {
    const tsType = mapMongoTypeToTypeScript(schema[key]);
    interfaceContent += `  ${key}${key === '_id' ? '?' : ''}: ${tsType};\n`;
  });
  interfaceContent += '}\n\n';

  // Schema Mongoose
  let interfaceImport = '';
  if (collectionName === 'users') {
    interfaceImport = `import { ${interfaceName} } from '../types';\n`;
  }
  let schemaContent = `import { Schema, model, Document } from 'mongoose';\n${interfaceImport}\n`;
  schemaContent += `export interface ${interfaceName}Document extends ${interfaceName}, Document {}\n\n`;
  schemaContent += `const ${collectionName}Schema = new Schema<${interfaceName}Document>({\n`;
  Object.keys(schema).forEach(key => {
    schemaContent += `  ${key}: { type: ${mapMongoTypeToMongoose(schema[key])}, required: ${key === '_id' ? 'false' : 'true'} },\n`;
  });
  schemaContent += '}, { timestamps: true });\n\n';
  schemaContent += `export const ${modelName} = model<${interfaceName}Document>('${modelName}', ${collectionName}Schema);\n`;

  // Ghi file
  const modelsDir = path.join(__dirname, 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
  }
  const filePath = path.join(modelsDir, `${modelName}.ts`);
  fs.writeFileSync(filePath, interfaceContent + schemaContent);
  console.log(`Generated model for ${modelName} at ${filePath}`);
}