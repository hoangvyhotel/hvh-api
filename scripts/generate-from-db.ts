#!/usr/bin/env ts-node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { database } from '../src/config/database';
import { DatabaseInspector } from '../src/utils/databaseInspector';
import { logger } from '../src/utils/logger';

const program = new Command();

program
  .name('generate-from-db')
  .description('Generate TypeScript interfaces and Mongoose models from existing database')
  .version('1.0.0');

program
  .command('types')
  .description('Generate TypeScript interfaces from database schema')
  .option('-o, --output <path>', 'Output file path', 'src/types/generated.ts')
  .action(async (options) => {
    try {
      logger.info('Connecting to database...');
      await database.connect();

      const inspector = new DatabaseInspector(database.getConnection());
      logger.info('Inspecting database schema...');
      
      const typesCode = await inspector.generateTypeScriptTypes();
      
      // Ensure directory exists
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(options.output, typesCode);
      logger.info(`TypeScript interfaces generated: ${options.output}`);

      await database.disconnect();
    } catch (error) {
      logger.error('Error generating types:', error);
      process.exit(1);
    }
  });

program
  .command('models')
  .description('Generate Mongoose models from database schema')
  .option('-o, --output <path>', 'Output directory path', 'src/models/generated')
  .action(async (options) => {
    try {
      logger.info('Connecting to database...');
      await database.connect();

      const inspector = new DatabaseInspector(database.getConnection());
      logger.info('Inspecting database schema...');
      
      const schemas = await inspector.inspectDatabase();
      
      // Ensure directory exists
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
      }

      // Generate model for each collection
      for (const schema of schemas) {
        const modelCode = inspector.generateMongooseSchema(schema);
        const fileName = `${schema.name}.ts`;
        const filePath = path.join(options.output, fileName);
        
        fs.writeFileSync(filePath, modelCode);
        logger.info(`Mongoose model generated: ${filePath}`);
      }

      // Generate index file
      const indexCode = schemas.map(schema => 
        `export * from './${schema.name}';`
      ).join('\n');
      
      const indexPath = path.join(options.output, 'index.ts');
      fs.writeFileSync(indexPath, indexCode);
      logger.info(`Index file generated: ${indexPath}`);

      await database.disconnect();
    } catch (error) {
      logger.error('Error generating models:', error);
      process.exit(1);
    }
  });

program
  .command('all')
  .description('Generate both TypeScript interfaces and Mongoose models')
  .option('-t, --types-output <path>', 'Types output file path', 'src/types/generated.ts')
  .option('-m, --models-output <path>', 'Models output directory path', 'src/models/generated')
  .action(async (options) => {
    try {
      logger.info('Connecting to database...');
      await database.connect();

      const inspector = new DatabaseInspector(database.getConnection());
      logger.info('Inspecting database schema...');
      
      const schemas = await inspector.inspectDatabase();
      
      // Generate types
      const typesCode = await inspector.generateTypeScriptTypes();
      const typesDir = path.dirname(options.typesOutput);
      if (!fs.existsSync(typesDir)) {
        fs.mkdirSync(typesDir, { recursive: true });
      }
      fs.writeFileSync(options.typesOutput, typesCode);
      logger.info(`TypeScript interfaces generated: ${options.typesOutput}`);

      // Generate models
      if (!fs.existsSync(options.modelsOutput)) {
        fs.mkdirSync(options.modelsOutput, { recursive: true });
      }

      for (const schema of schemas) {
        const modelCode = inspector.generateMongooseSchema(schema);
        const fileName = `${schema.name}.ts`;
        const filePath = path.join(options.modelsOutput, fileName);
        
        fs.writeFileSync(filePath, modelCode);
        logger.info(`Mongoose model generated: ${filePath}`);
      }

      // Generate index file
      const indexCode = schemas.map(schema => 
        `export * from './${schema.name}';`
      ).join('\n');
      
      const indexPath = path.join(options.modelsOutput, 'index.ts');
      fs.writeFileSync(indexPath, indexCode);
      logger.info(`Index file generated: ${indexPath}`);

      await database.disconnect();
      logger.info('All files generated successfully!');
    } catch (error) {
      logger.error('Error generating files:', error);
      process.exit(1);
    }
  });

program
  .command('inspect')
  .description('Inspect database schema and show details')
  .action(async () => {
    try {
      logger.info('Connecting to database...');
      await database.connect();

      const inspector = new DatabaseInspector(database.getConnection());
      logger.info('Inspecting database schema...');
      
      const schemas = await inspector.inspectDatabase();
      
      console.log('\n📊 Database Schema Inspection Results:\n');
      
      schemas.forEach(schema => {
        console.log(`📁 Collection: ${schema.name}`);
        console.log(`   Fields: ${schema.fields.length}`);
        console.log(`   Indexes: ${schema.indexes.length}`);
        console.log(`   Validation Rules: ${Object.keys(schema.validationRules).length > 0 ? 'Yes' : 'No'}`);
        
        console.log('\n   📋 Fields:');
        schema.fields.forEach(field => {
          const required = field.required ? '✅' : '❌';
          const type = field.enum ? `enum(${field.enum.join(', ')})` : field.type;
          console.log(`     ${required} ${field.name}: ${type}${field.description ? ` - ${field.description}` : ''}`);
        });
        
        if (schema.indexes.length > 0) {
          console.log('\n   🔍 Indexes:');
          schema.indexes.forEach(index => {
            console.log(`     - ${index}`);
          });
        }
        
        console.log('\n' + '─'.repeat(50) + '\n');
      });

      await database.disconnect();
    } catch (error) {
      logger.error('Error inspecting database:', error);
      process.exit(1);
    }
  });

program.parse();
