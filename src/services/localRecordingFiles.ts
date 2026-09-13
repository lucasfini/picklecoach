import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const RECORDING_CACHE_DIRECTORY = 'picklecoach-recordings';

function recordingDirectory() {
  return new Directory(Paths.cache, RECORDING_CACHE_DIRECTORY);
}

function safeVideoExtension(video: File) {
  return /^\.[a-z0-9]{1,8}$/i.test(video.extension) ? video.extension.toLowerCase() : '.mov';
}

/**
 * Moves a camera-owned temporary file into a cache directory owned exclusively
 * by PickleCoach. This lets startup cleanup remove abandoned clips without
 * touching unrelated Expo or operating-system cache files.
 */
export async function adoptLocalRecording(videoUri: string) {
  if (Platform.OS === 'web') {
    return videoUri;
  }

  const source = new File(videoUri);
  if (!source.exists) {
    throw new Error('The captured video file is unavailable.');
  }

  const directory = recordingDirectory();
  directory.create({ idempotent: true, intermediates: true });

  if (source.uri.startsWith(directory.uri)) {
    return source.uri;
  }

  const destination = new File(
    directory,
    `capture-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeVideoExtension(source)}`,
  );

  try {
    await source.move(destination);
    return destination.uri;
  } catch (error) {
    await deleteLocalRecording(videoUri);
    throw new Error('The captured video could not be prepared for private review.', { cause: error });
  }
}

export async function deleteLocalRecording(videoUri: string) {
  try {
    const video = new File(videoUri);

    if (video.exists) {
      video.delete();
    }
  } catch (error) {
    console.warn('Unable to delete local practice recording.', error);
  }
}

/** Deletes only the app-owned recording cache, including clips left by a crash. */
export async function purgeLocalRecordings() {
  if (Platform.OS === 'web') {
    return 0;
  }

  try {
    const directory = recordingDirectory();
    if (!directory.exists) {
      return 0;
    }

    const deletedCount = directory.list().length;
    directory.delete();
    return deletedCount;
  } catch (error) {
    console.warn('Unable to clear temporary practice recordings.', error);
    throw new Error('Temporary practice recordings could not be cleared.', { cause: error });
  }
}
