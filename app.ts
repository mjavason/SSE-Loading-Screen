import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';

//#region App Setup
const app = express();
dotenv.config({ path: './.env' });
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

const SWAGGER_OPTIONS = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Typescript SFA',
      version: '1.0.0',
      description:
        'This is a single file typescript template app for faster idea testing and prototyping. It contains tests, one demo root API call, basic async error handling, one demo axios call and .env support.',
      contact: {
        name: 'Orji Michael',
        email: 'orjimichael4886@gmail.com',
      },
    },
    servers: [
      {
        url: BASE_URL,
      },
    ],
    tags: [
      {
        name: 'Default',
        description: 'Default API Operations that come inbuilt',
      },
    ],
  },
  apis: ['**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(SWAGGER_OPTIONS);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(morgan('dev'));

//#endregion

//#region Keys and Configs
const PORT = process.env.PORT || 5000;
//#endregion

//#region Code here

/**
 * @swagger
 * /progress:
 *   get:
 *     tags: [SSE]
 *     summary: Streams progress updates.
 *     description: Returns a Server-Sent Event (SSE) stream with progress updates.
 *     responses:
 *       200:
 *         description: A stream of progress updates.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       500:
 *         description: Internal server error.
 */
app.get('/progress', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 1; // Increment progress
    progress.toPrecision(2);

    res.write(`data: ${Math.floor(progress)}\n\n`);

    if (progress >= 100) {
      clearInterval(interval);
      res.write(`event: done\ndata: Loading complete\n\n`);
      res.end();
    }
  }, 100); // Send progress every second

  req.on('close', () => {
    clearInterval(interval);
  });
});

//#endregion

//#region Server Setup
// Function to ping the server itself
async function pingSelf() {
  try {
    const { data } = await axios.get(`http://localhost:5000`);
    console.log(`Server pinged successfully: ${data.message}`);
    return true;
  } catch (e: any) {
    console.error(`Error pinging server: ${e.message}`);
    return false;
  }
}

// Route for external API call
/**
 * @swagger
 * /api:
 *   get:
 *     summary: Call a demo external API (httpbin.org)
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/api', async (req: Request, res: Response) => {
  try {
    const result = await axios.get('https://httpbin.org');
    return res.send({
      message: 'Demo API called (httpbin.org)',
      data: result.status,
    });
  } catch (error: any) {
    console.error('Error calling external API:', error.message);
    return res.status(500).send({ error: 'Failed to call external API' });
  }
});

// Route for health check
/**
 * @swagger
 * /:
 *   get:
 *     summary: API Health check
 *     description: Returns an object containing demo content
 *     tags: [Default]
 *     responses:
 *       '200':
 *         description: Successful.
 *       '400':
 *         description: Bad request.
 */
app.get('/', (req: Request, res: Response) => {
  return res.send({ message: 'API is Live!' });
});

// Middleware to handle 404 Not Found
/**
 * @swagger
 * /obviously/this/route/cant/exist:
 *   get:
 *     summary: API 404 Response
 *     description: Returns a non-crashing result when you try to run a route that doesn't exist
 *     tags: [Default]
 *     responses:
 *       '404':
 *         description: Route not found
 */
app.use((req: Request, res: Response) => {
  return res
    .status(404)
    .json({ success: false, message: 'API route does not exist' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // throw Error('This is a sample error');

  console.log(`${'\x1b[31m'}${err.message}${'\x1b][0m]'} `);
  return res
    .status(500)
    .send({ success: false, status: 500, message: err.message });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// (for render services) Keep the API awake by pinging it periodically
// setInterval(pingSelf, 600000);

//#endregion
