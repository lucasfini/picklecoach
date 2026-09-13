#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import {
  buildPoseBenchmarkReport,
  isPoseBenchmarkRun,
} from '../src/domain/poseBenchmark.ts';

const execFileAsync = promisify(execFile);
const bundleIdentifier = 'com.lucasfini.picklecoach';
const benchmarkSource = 'Documents/picklecoach-pose-benchmark-runs.json';

export function parseDeviceArgument(argumentsList) {
  if (argumentsList.length !== 2 || argumentsList[0] !== '--device') {
    return null;
  }
  const device = argumentsList[1]?.trim();
  return device ? device : null;
}

export function parseBenchmarkFileContents(contents) {
  const value = JSON.parse(contents);
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('No saved Pose Lab runs were found.');
  }
  if (!value.every(isPoseBenchmarkRun)) {
    throw new Error('The device benchmark file contains an invalid or unsafe record.');
  }
  return value;
}

export async function pullPoseBenchmarkReport(device) {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'picklecoach-benchmark-'));
  const destination = join(temporaryDirectory, 'pose-benchmark-runs.json');

  try {
    await execFileAsync('xcrun', [
      'devicectl',
      'device',
      'copy',
      'from',
      '--device',
      device,
      '--source',
      benchmarkSource,
      '--destination',
      destination,
      '--domain-type',
      'appDataContainer',
      '--domain-identifier',
      bundleIdentifier,
    ]);
    const runs = parseBenchmarkFileContents(await readFile(destination, 'utf8'));
    return buildPoseBenchmarkReport(runs);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

async function main() {
  const device = parseDeviceArgument(process.argv.slice(2));
  if (!device) {
    throw new Error('Usage: npm run benchmark:pull:ios -- --device "iPhone name or identifier"');
  }

  try {
    process.stdout.write(`${await pullPoseBenchmarkReport(device)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('picklecoach-pose-benchmark-runs.json')) {
      throw new Error('No device benchmark file exists yet. Save one Pose Lab visual review, then retry.', {
        cause: error,
      });
    }
    throw error;
  }
}

const isDirectInvocation = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectInvocation) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
