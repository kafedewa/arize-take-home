/*instrumentation.ts */

import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { 
  OpenAIInstrumentation 
} from "@arizeai/openinference-instrumentation-openai";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { 
  OTLPTraceExporter as GrpcOTLPTraceExporter 
} from "@opentelemetry/exporter-trace-otlp-grpc"; // Arize specific
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { Metadata } from "@grpc/grpc-js"

import dotenv from "dotenv";

dotenv.config();

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Arize specific - Create metadata and add your headers
const metadata = new Metadata();

// Your Arize Space and API Keys, which can be found in the UI
if (!process.env.ARIZE_SPACE_ID || !process.env.ARIZE_API_KEY) {
    throw new Error('Missing required environment variables: ARIZE_SPACE_ID or ARIZE_API_KEY');
  }
metadata.set('space_id', process.env.ARIZE_SPACE_ID);
metadata.set('api_key', process.env.ARIZE_API_KEY);
metadata.set('project_name', 'takehome');

const processor = new SimpleSpanProcessor(new ConsoleSpanExporter());
const otlpProcessor = new SimpleSpanProcessor(
  new GrpcOTLPTraceExporter({
    url: "https://otlp.arize.com/v1",
    metadata
  }),
);


const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
        // Arize specific - The name of a new or preexisting model you 
        // want to export spans to
        ["model_id"]: "your-model-id",
        ["model_version"]: "your-model-version"
    }),
  spanProcessors: [processor, otlpProcessor],
});

console.log(provider);

registerInstrumentations({
  instrumentations: [new OpenAIInstrumentation({})],
});

provider.register();

console.log("Instrumentation registered");


/*
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { 
  OpenAIInstrumentation 
} from "@arizeai/openinference-instrumentation-openai";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { 
  OTLPTraceExporter as GrpcOTLPTraceExporter 
} from "@opentelemetry/exporter-trace-otlp-grpc"; // Arize specific
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { Metadata } from "@grpc/grpc-js"

import dotenv from "dotenv";

dotenv.config();

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Arize specific - Create metadata and add your headers
const metadata = new Metadata();

// Your Arize Space and API Keys, which can be found in the UI
if (!process.env.ARIZE_SPACE_ID || !process.env.ARIZE_API_KEY) {
  throw new Error('Missing required environment variables: ARIZE_SPACE_ID or ARIZE_API_KEY');
}
metadata.set('space_id', process.env.ARIZE_SPACE_ID);
metadata.set('api_key', process.env.ARIZE_API_KEY);
metadata.set('project_name', 'takehome');

console.log(process.env.ARIZE_API_KEY);

const processor = new SimpleSpanProcessor(new ConsoleSpanExporter());
const otlpProcessor = new SimpleSpanProcessor(
  new GrpcOTLPTraceExporter({
    url: "otlp.arize.com",
    metadata,
  }),
);

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    // Arize specific - The name of a new or preexisting model you 
    // want to export spans to
    ["model_id"]: "OAI-gpt-4o",
    ["model_version"]: "gpt-4o"
  }),
  spanProcessors: [processor, otlpProcessor],
});

registerInstrumentations({
  instrumentations: [new OpenAIInstrumentation({})],
});

provider.register();
*/