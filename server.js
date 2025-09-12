#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "test-ui-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
    },
  }
);

// Resource handler für UI-Tabelle
server.setRequestHandler("resources/list", async () => {
  return {
    resources: [
      {
        uri: "ui://table",
        name: "System-Info Tabelle",
        description: "Zeigt CPU und RAM Informationen in einer Tabelle",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler("resources/read", async (request) => {
  if (request.params.uri === "ui://table") {
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify({
            component: "table",
            props: {
              columns: ["Name", "Wert"],
              rows: [
                ["CPU", "42%"],
                ["RAM", "3.2 GB"],
                ["Speicher", "128 GB"],
                ["Status", "Online"],
              ],
            },
          }),
        },
      ],
    };
  }
  throw new Error(`Unbekannte Resource: ${request.params.uri}`);
});

// Server starten
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Test-UI-Server läuft...");
}

main().catch(console.error);
