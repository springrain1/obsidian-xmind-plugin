import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.argv[2];
const manifestPath = "manifest.json";
const versionsPath = "versions.json";

// read minAppVersion from manifest.json
let manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const { minAppVersion } = manifest;

// update version in manifest.json
manifest.version = targetVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

// update versions.json with new version
let versions = JSON.parse(readFileSync(versionsPath, "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync(versionsPath, JSON.stringify(versions, null, "\t")); 