import { File } from 'expo-file-system';

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
