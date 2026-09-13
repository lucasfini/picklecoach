import { isPoseBenchmarkRun, PoseBenchmarkRun } from '@/src/domain/poseBenchmark';
import { deleteLocalJson, readLocalJson, writeLocalJson } from '@/src/services/localJsonStore';

const BENCHMARK_STORAGE_KEY = 'pose-benchmark-runs';
const MAXIMUM_SAVED_RUNS = 100;
let mutationQueue: Promise<void> = Promise.resolve();

function enqueueMutation<T>(mutation: () => Promise<T>) {
  const operation = mutationQueue.then(mutation, mutation);
  mutationQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function readPoseBenchmarkRuns() {
  const storedRuns = await readLocalJson<unknown>(BENCHMARK_STORAGE_KEY);
  return Array.isArray(storedRuns) ? storedRuns.filter(isPoseBenchmarkRun) : [];
}

export function appendPoseBenchmarkRun(run: PoseBenchmarkRun) {
  return enqueueMutation(async () => {
    const existingRuns = await readPoseBenchmarkRuns();
    const nextRuns = [run, ...existingRuns.filter((item) => item.id !== run.id)]
      .slice(0, MAXIMUM_SAVED_RUNS);
    const didSave = await writeLocalJson(BENCHMARK_STORAGE_KEY, nextRuns);
    if (!didSave) {
      throw new Error('The local pose benchmark summary could not be saved.');
    }
    return nextRuns;
  });
}

export function updatePoseBenchmarkRun(run: PoseBenchmarkRun) {
  return enqueueMutation(async () => {
    const existingRuns = await readPoseBenchmarkRuns();
    if (!existingRuns.some((item) => item.id === run.id)) {
      throw new Error('The pose benchmark run no longer exists.');
    }
    const nextRuns = existingRuns.map((item) => item.id === run.id ? run : item);
    const didSave = await writeLocalJson(BENCHMARK_STORAGE_KEY, nextRuns);
    if (!didSave) {
      throw new Error('The local pose benchmark review could not be saved.');
    }
    return nextRuns;
  });
}

export function clearPoseBenchmarkRuns() {
  return enqueueMutation(async () => {
    const didDelete = await deleteLocalJson(BENCHMARK_STORAGE_KEY);
    if (!didDelete) {
      throw new Error('The local pose benchmark history could not be cleared.');
    }
  });
}
