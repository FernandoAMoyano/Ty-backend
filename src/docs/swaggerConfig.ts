import YAML from 'yamljs';
import path from 'path';

// Cargar la especificación desde el archivo YAML
const swaggerYamlPath = path.join(__dirname, 'swagger.yaml');
let swaggerSpec: any;

try {
  swaggerSpec = YAML.load(swaggerYamlPath);
} catch (error) {
  console.error('Error loading swagger.yaml:', error);
  // especificación básica si no encuentra el archivo
  swaggerSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Turnity Backend API',
      version: '1.0.0',
      description: 'API documentation for Turnity Backend',
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://api.turnity.com/v1'
            : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
  };
}

// Configuración dinámica basada en el entorno
if (process.env.NODE_ENV === 'development') {
  if (!swaggerSpec.servers?.find((s: any) => s.url.includes('localhost'))) {
    swaggerSpec.servers = swaggerSpec.servers || [];
    swaggerSpec.servers.unshift({
      url: 'http://localhost:3000/api/v1',
      description: 'Local Development Server',
    });
  }
}

export const swaggerSpecification = swaggerSpec;

export const swaggerUiOptions = {
  swaggerOptions: {
    docExpansion: 'list',
    persistAuthorization: true,
  },
  customCss: `
    .swagger-ui .opblock-tag {
      flex-direction:column !important;
      align-items: flex-start !important;
      text-align: left !important;
    }
  `,
  customSiteTitle: 'Turnity API Documentation',
};

export const swaggerInfo = {
  title: swaggerSpec.info?.title || 'Turnity API',
  version: swaggerSpec.info?.version || '1.0.0',
  description: swaggerSpec.info?.description || 'API Documentation',
  docsPath: '/api/docs',
  jsonPath: '/api/docs.json',
};
