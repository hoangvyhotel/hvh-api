import mongoose from 'mongoose';
import { logger } from './logger';

export interface DatabaseField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  enum?: string[];
  min?: number;
  max?: number;
  pattern?: string;
  ref?: string;
}

export interface CollectionSchema {
  name: string;
  fields: DatabaseField[];
  indexes: string[];
  validationRules: any;
}

export class DatabaseInspector {
  private connection: mongoose.Connection;

  constructor(connection: mongoose.Connection) {
    this.connection = connection;
  }

  /**
   * Inspect database collections and their schemas
   */
  async inspectDatabase(): Promise<CollectionSchema[]> {
    try {
      const collections = await this.connection.db?.listCollections().toArray() || [];
      const schemas: CollectionSchema[] = [];

      for (const collection of collections) {
        const schema = await this.inspectCollection(collection.name);
        if (schema) {
          schemas.push(schema);
        }
      }

      return schemas;
    } catch (error) {
      logger.error('Error inspecting database:', error);
      throw error;
    }
  }

  /**
   * Inspect a specific collection
   */
  async inspectCollection(collectionName: string): Promise<CollectionSchema | null> {
    try {
      const collection = this.connection.db?.collection(collectionName);
      if (!collection) {
        logger.error(`Collection ${collectionName} not found`);
        return null;
      }
      
      // Get collection options (validation rules)
      const options = await collection.options();
      
      // Get indexes
      const indexes = await collection.indexes();
      const indexFields = indexes.map(index => Object.keys(index.key).join(', '));

      // Get sample documents to infer schema
      const sampleDocs = await collection.find({}).limit(10).toArray();
      
      if (sampleDocs.length === 0) {
        logger.warn(`Collection ${collectionName} is empty, cannot infer schema`);
        return null;
      }

      // Infer fields from sample documents
      const fields = this.inferFieldsFromDocuments(sampleDocs, options?.validator);

      return {
        name: collectionName,
        fields,
        indexes: indexFields,
        validationRules: options?.validator || {}
      };
    } catch (error) {
      logger.error(`Error inspecting collection ${collectionName}:`, error);
      return null;
    }
  }

  /**
   * Infer field types from sample documents
   */
  private inferFieldsFromDocuments(docs: any[], validationRules?: any): DatabaseField[] {
    const fields: DatabaseField[] = [];
    const fieldTypes = new Map<string, Set<string>>();
    const fieldRequired = new Map<string, boolean>();

    // Analyze all documents
    docs.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (!fieldTypes.has(key)) {
          fieldTypes.set(key, new Set());
        }
        fieldTypes.get(key)!.add(typeof doc[key]);
      });
    });

    // Determine field types and requirements
    fieldTypes.forEach((types, fieldName) => {
      const type = this.determineFieldType(types, fieldName, validationRules);
      const required = this.isFieldRequired(fieldName, validationRules);
      
      fields.push({
        name: fieldName,
        type,
        required,
        description: this.getFieldDescription(fieldName, validationRules),
        enum: this.getFieldEnum(fieldName, validationRules),
        min: this.getFieldMin(fieldName, validationRules),
        max: this.getFieldMax(fieldName, validationRules),
        pattern: this.getFieldPattern(fieldName, validationRules),
        ref: this.getFieldRef(fieldName, validationRules)
      });
    });

    return fields.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Determine the most appropriate TypeScript type
   */
  private determineFieldType(types: Set<string>, fieldName: string, validationRules?: any): string {
    // Check if it's an ObjectId reference
    if (validationRules?.$jsonSchema?.properties?.[fieldName]?.bsonType === 'objectId') {
      return 'ObjectId';
    }

    // Check if it's an enum
    if (validationRules?.$jsonSchema?.properties?.[fieldName]?.enum) {
      return 'string';
    }

    // Determine type from actual values
    if (types.has('object') && types.has('string')) {
      return 'any';
    } else if (types.has('object')) {
      return 'object';
    } else if (types.has('array')) {
      return 'any[]';
    } else if (types.has('string')) {
      return 'string';
    } else if (types.has('number')) {
      return 'number';
    } else if (types.has('boolean')) {
      return 'boolean';
    } else if (types.has('date')) {
      return 'Date';
    }

    return 'any';
  }

  /**
   * Check if field is required based on validation rules
   */
  private isFieldRequired(fieldName: string, validationRules?: any): boolean {
    return validationRules?.$jsonSchema?.required?.includes(fieldName) || false;
  }

  /**
   * Get field description from validation rules
   */
  private getFieldDescription(fieldName: string, validationRules?: any): string | undefined {
    return validationRules?.$jsonSchema?.properties?.[fieldName]?.description;
  }

  /**
   * Get field enum values from validation rules
   */
  private getFieldEnum(fieldName: string, validationRules?: any): string[] | undefined {
    return validationRules?.$jsonSchema?.properties?.[fieldName]?.enum;
  }

  /**
   * Get field minimum value from validation rules
   */
  private getFieldMin(fieldName: string, validationRules?: any): number | undefined {
    return validationRules?.$jsonSchema?.properties?.[fieldName]?.minimum;
  }

  /**
   * Get field maximum value from validation rules
   */
  private getFieldMax(fieldName: string, validationRules?: any): number | undefined {
    return validationRules?.$jsonSchema?.properties?.[fieldName]?.maxLength;
  }

  /**
   * Get field pattern from validation rules
   */
  private getFieldPattern(fieldName: string, validationRules?: any): string | undefined {
    return validationRules?.$jsonSchema?.properties?.[fieldName]?.pattern;
  }

  /**
   * Get field reference from validation rules
   */
  private getFieldRef(fieldName: string, validationRules?: any): string | undefined {
    return validationRules?.$jsonSchema?.properties?.[fieldName]?.ref;
  }

  /**
   * Generate TypeScript interface from collection schema
   */
  generateTypeScriptInterface(schema: CollectionSchema): string {
    let interfaceCode = `export interface I${this.capitalizeFirst(schema.name)} {\n`;

    schema.fields.forEach(field => {
      const optional = field.required ? '' : '?';
      const type = this.mapToTypeScriptType(field.type, field.enum);
      
      interfaceCode += `  ${field.name}${optional}: ${type};\n`;
    });

    interfaceCode += '}\n\n';

    // Generate enum if needed
    schema.fields.forEach(field => {
      if (field.enum && field.enum.length > 0) {
        const enumName = this.capitalizeFirst(schema.name) + this.capitalizeFirst(field.name);
        interfaceCode += `export enum ${enumName} {\n`;
        field.enum.forEach(value => {
          interfaceCode += `  ${value.toUpperCase()} = '${value}',\n`;
        });
        interfaceCode += '}\n\n';
      }
    });

    return interfaceCode;
  }

  /**
   * Map database types to TypeScript types
   */
  private mapToTypeScriptType(dbType: string, enumValues?: string[]): string {
    if (enumValues && enumValues.length > 0) {
      const enumName = enumValues.map(v => `'${v}'`).join(' | ');
      return enumName;
    }

    switch (dbType) {
      case 'ObjectId':
        return 'string';
      case 'Date':
        return 'Date';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'string':
        return 'string';
      case 'any[]':
        return 'any[]';
      case 'object':
        return 'Record<string, any>';
      default:
        return 'any';
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate complete TypeScript types file
   */
  async generateTypeScriptTypes(): Promise<string> {
    const schemas = await this.inspectDatabase();
    let typesCode = '// Auto-generated TypeScript types from database schema\n';
    typesCode += '// Generated on: ' + new Date().toISOString() + '\n\n';

    schemas.forEach(schema => {
      typesCode += this.generateTypeScriptInterface(schema);
    });

    return typesCode;
  }

  /**
   * Generate Mongoose schema from database schema
   */
  generateMongooseSchema(schema: CollectionSchema): string {
    let mongooseCode = `import mongoose, { Schema } from 'mongoose';\n`;
    mongooseCode += `import { I${this.capitalizeFirst(schema.name)} } from '@/types';\n\n`;

    mongooseCode += `const ${schema.name}Schema = new Schema<I${this.capitalizeFirst(schema.name)}>({\n`;

    schema.fields.forEach(field => {
      if (field.name === '_id') return; // Skip _id field

      mongooseCode += `  ${field.name}: {\n`;
      mongooseCode += `    type: ${this.mapToMongooseType(field.type)},\n`;
      
      if (field.required) {
        mongooseCode += `    required: [true, '${field.name} is required'],\n`;
      }

      if (field.enum) {
        mongooseCode += `    enum: [${field.enum.map(v => `'${v}'`).join(', ')}],\n`;
      }

      if (field.min !== undefined) {
        mongooseCode += `    min: [${field.min}, '${field.name} must be at least ${field.min}'],\n`;
      }

      if (field.max !== undefined) {
        mongooseCode += `    max: [${field.max}, '${field.name} cannot exceed ${field.max}'],\n`;
      }

      if (field.pattern) {
        mongooseCode += `    match: [${field.pattern}, 'Please enter a valid ${field.name}'],\n`;
      }

      if (field.ref) {
        mongooseCode += `    ref: '${field.ref}',\n`;
      }

      mongooseCode += `  },\n`;
    });

    mongooseCode += `}, {\n`;
    mongooseCode += `  timestamps: true,\n`;
    mongooseCode += `});\n\n`;

    // Add indexes
    if (schema.indexes.length > 0) {
      mongooseCode += `// Indexes\n`;
      schema.indexes.forEach(index => {
        mongooseCode += `// ${schema.name}Schema.index({ ${index} });\n`;
      });
      mongooseCode += '\n';
    }

    mongooseCode += `export const ${this.capitalizeFirst(schema.name)} = mongoose.model<I${this.capitalizeFirst(schema.name)}>('${this.capitalizeFirst(schema.name)}', ${schema.name}Schema);\n`;

    return mongooseCode;
  }

  /**
   * Map to Mongoose schema type
   */
  private mapToMongooseType(tsType: string): string {
    switch (tsType) {
      case 'string':
        return 'String';
      case 'number':
        return 'Number';
      case 'boolean':
        return 'Boolean';
      case 'Date':
        return 'Date';
      case 'any[]':
        return '[String]';
      case 'ObjectId':
        return 'Schema.Types.ObjectId';
      default:
        return 'String';
    }
  }
}
