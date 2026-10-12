import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { connectDemo, demoConfig, DB_NAME, MANIFEST_ID, safeError } from "./config.js";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

function localTarget(uriValue) {
    let uri;
    try {
        uri = new URL(uriValue);
    } catch {
        throw safeError("MONGO_URI is invalid; its value will not be printed.");
    }

    const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
    if (uri.protocol !== "mongodb:" || !localHosts.has(uri.hostname.toLowerCase())) {
        throw safeError("Copy refused: MONGO_URI must point to a local MongoDB host.");
    }
    if (uri.searchParams.has("dbName")) {
        throw safeError("Copy refused: remove the dbName URI override and specify the database in the URI path.");
    }

    const databaseName = decodeURIComponent(uri.pathname.replace(/^\//, ""));
    if (!databaseName || databaseName === DB_NAME) {
        throw safeError(`Copy refused: MONGO_URI must select a database other than ${DB_NAME}.`);
    }
    return { uri: uriValue, databaseName };
}

async function main() {
    if (String(process.env.NODE_ENV).toLowerCase() === "production") {
        throw safeError("Copy refused in production mode.");
    }
    if (!process.env.MONGO_URI) {
        throw safeError("MONGO_URI is missing from server/.env.");
    }

    const target = localTarget(process.env.MONGO_URI);
    const demo = demoConfig();
    await connectDemo(demo);

    const sourceDb = mongoose.connection.db;
    const manifest = await sourceDb.collection("demo_seed_manifest").findOne({ _id: MANIFEST_ID, state: "complete" });
    if (!manifest) {
        throw safeError("The dedicated demo database does not contain a completed demo seed.");
    }

    const client = new mongoose.mongo.MongoClient(target.uri, { serverSelectionTimeoutMS: 10000 });
    try {
        await client.connect();
        const targetDb = client.db(target.databaseName);
        const existing = await targetDb.listCollections({}, { nameOnly: true }).toArray();
        for (const { name } of existing) {
            if (name.startsWith("system.")) continue;
            const hasDocuments = await targetDb.collection(name).findOne({}, { projection: { _id: 1 } });
            if (hasDocuments) {
                throw safeError(`Copy refused: destination database "${target.databaseName}" contains data. Nothing was copied.`);
            }
        }

        const collections = await sourceDb.listCollections({}, { nameOnly: true }).toArray();
        let collectionCount = 0;
        let documentCount = 0;

        for (const { name } of collections) {
            if (name.startsWith("system.")) continue;
            const source = sourceDb.collection(name);
            const targetCollection = targetDb.collection(name);
            const cursor = source.find({});
            let batch = [];
            let collectionDocuments = 0;

            for await (const document of cursor) {
                batch.push(document);
                if (batch.length === 500) {
                    await targetCollection.insertMany(batch, { ordered: true });
                    documentCount += batch.length;
                    collectionDocuments += batch.length;
                    batch = [];
                }
            }
            if (batch.length) {
                await targetCollection.insertMany(batch, { ordered: true });
                documentCount += batch.length;
                collectionDocuments += batch.length;
            }
            if (collectionDocuments) collectionCount++;
        }

        console.log(`Copied ${documentCount} demo documents from ${DB_NAME} into local database "${target.databaseName}" across ${collectionCount} collections.`);
        console.log("No connection URI, username, password, or document contents were printed.");
    } finally {
        await client.close();
    }
}

main()
    .catch(error => {
        console.error(error.demoSafe ? error.message : `Demo copy failed (${error.name || "Error"}${error.code ? `, code ${error.code}` : ""}). Check the local MongoDB service; no connection details were printed.`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
