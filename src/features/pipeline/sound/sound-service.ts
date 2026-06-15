// Sound service — forward-looking scaffolding for audio beds on video creatives.
// The interface is real and wired into the pipeline, but the only implementation
// is a no-op gated by SOUND_ENABLED. A real provider (e.g. an ElevenLabs/Cartesia
// audio API) would implement this same interface and be swapped in unchanged.
export interface SoundInput {
  campaignName: string
  message: string
  locale?: string
}

export interface SoundResult {
  id: string
  status: 'disabled' | 'queued' | 'ready'
  url?: string
}

export interface SoundService {
  generateSoundtrack(input: SoundInput): Promise<SoundResult>
  getStatus(id: string): Promise<SoundResult>
}

/** No-op implementation: never calls an external service. */
export class NoopSoundService implements SoundService {
  async generateSoundtrack(): Promise<SoundResult> {
    return { id: 'sound-disabled', status: 'disabled' }
  }
  async getStatus(id: string): Promise<SoundResult> {
    return { id, status: 'disabled' }
  }
}

/** Returns the configured sound service. Always the no-op until a provider ships. */
export function getSoundService(enabled: boolean): SoundService {
  void enabled // flag reserved for the future real provider; no-op is the only path today.
  return new NoopSoundService()
}
