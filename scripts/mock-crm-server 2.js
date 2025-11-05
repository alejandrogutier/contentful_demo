#!/usr/bin/env node

/**
 * Servidor HTTP súper liviano para simular un CRM/ERP externo.
 * Persiste los leads en un JSON local y emite logs en consola.
 */

const { createServer } = require("node:http");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");

const CRM_PORT = process.env.CRM_PORT ? Number(process.env.CRM_PORT) : 3333;
const BASE_DIR = __dirname;
const DATA_DIR = join(BASE_DIR, "tmp");
const DB_PATH = join(DATA_DIR, "leads.json");

async function persistLead(lead) {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }

  const current = existsSync(DB_PATH)
    ? JSON.parse(await readFile(DB_PATH, "utf-8"))
    : [];
  current.push(lead);

  await writeFile(DB_PATH, JSON.stringify(current, null, 2), "utf-8");
}

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/leads") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        const lead = {
          ...payload,
          crmId: randomUUID()
        };
        await persistLead(lead);
        console.log("[CRM] Lead recibido:", lead);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, crmId: lead.crmId }));
      } catch (error) {
        console.error("[CRM] Error procesando lead", error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, message: "Payload inválido" }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/leads") {
    const leads = existsSync(DB_PATH)
      ? JSON.parse(await readFile(DB_PATH, "utf-8"))
      : [];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(leads));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, message: "Not found" }));
});

server.listen(CRM_PORT, () => {
  console.log(`CRM simulado escuchando en http://localhost:${CRM_PORT}`);
});
