/* eslint-disable @typescript-eslint/no-require-imports */

"use strict";
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const unquote = (value) => {
  const quoted = /^(["'])(.*)\1$/.exec(value);
  return quoted ? quoted[2] : value;
};

const stripInlineComment = (raw) => {
  let quote = null;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (quote) { if (ch === quote) quote = null; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "#" && (i === 0 || /\s/.test(raw[i - 1]))) return raw.slice(0, i).trim();
  }
  return raw.trim();
};

function readServiceTrigger(renderYaml, serviceName = "academiaarcana") {
  if (typeof renderYaml !== "string" || renderYaml.length === 0) {
    throw new Error("Empty Blueprint; cannot verify auto-deploy policy.");
  }
  const lines = renderYaml.replaceAll("\r\n", "\n").split("\n");
  const live = lines.filter((line) => !/^\s*#/.test(line));
  const starts = [];
  live.forEach((line, index) => {
    if (/^\s*-\s*type:\s*["']?web["']?\s*$/.test(line)) starts.push(index);
  });

  const found = [];
  for (let n = 0; n < starts.length; n += 1) {
    const end = n + 1 < starts.length ? starts[n + 1] : live.length;
    const block = live.slice(starts[n], end);
    const nameLine = block.find((line) => /^\s+name:\s*/.test(line));
    if (!nameLine) continue;
    const name = unquote(stripInlineComment(nameLine.replace(/^\s+name:\s*/, "")));
    if (name !== serviceName) continue;

    const triggerLines = block.filter((line) => /^\s+autoDeployTrigger:\s*/.test(line));
    if (triggerLines.length !== 1) {
      throw new Error(`Expected exactly one autoDeployTrigger in service ${serviceName}; found ${triggerLines.length}.`);
    }
    const raw = stripInlineComment(triggerLines[0].replace(/^\s+autoDeployTrigger:\s*/, ""));
    if (!/^(["'])(off|commit|checksPass)\1$/.test(raw)) {
      throw new Error("autoDeployTrigger must be a quoted string enum value.");
    }
    found.push(unquote(raw));
  }
  if (found.length !== 1) {
    throw new Error(`Expected exactly one web service named ${serviceName}; found ${found.length}.`);
  }
  return found[0];
}

const readBlueprintTrigger = (root) =>
  readServiceTrigger(readFileSync(resolve(root, "render.yaml"), "utf8"));

function assertFrozenBlueprint(root) {
  const trigger = readBlueprintTrigger(root);
  if (trigger !== "off") throw new Error(`Render auto-deploy must be "off" under NO-GO; found "${trigger}".`);
  return trigger;
}

module.exports = { readServiceTrigger, readBlueprintTrigger, assertFrozenBlueprint };
