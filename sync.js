/** Revision-based saves; concurrent devices never silently overwrite each other. */
export class CloudSync {
  constructor({revision = 0, save, onStatus = () => {}, onDraft = () => {}}) {
    Object.assign(this, {revision, saveRemote: save, onStatus, onDraft});
    this.pending = null; this.saving = null; this.conflict = false; this.stopped = false;
  }
  queue(state) {
    if (this.stopped) return;
    this.pending = structuredClone(state);
    this.onDraft({revision:this.revision,state:this.pending});
    this.onStatus('pending');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush().catch(() => {}), 700);
  }
  async flush() {
    clearTimeout(this.timer);
    if (this.stopped || this.conflict) return false;
    if (this.saving) { await this.saving; return this.stopped ? false : this.pending ? this.flush() : !this.conflict; }
    if (!this.pending) return true;
    const state = this.pending;
    this.pending = null;
    this.onStatus('saving');
    this.saving = (async () => {
      try {
        // Defer invocation so even a synchronous transport error occurs after
        // this.saving is assigned and can be cleared in finally.
        const result = await Promise.resolve().then(() => {
          if (this.stopped) return null;
          return this.saveRemote(state, this.revision);
        });
        if (this.stopped) return;
        this.revision = result.revision;
        this.onDraft(this.pending ? {revision:this.revision,state:this.pending} : null);
        this.onStatus(this.pending ? 'pending' : 'saved', result.updated_at);
      } catch (error) {
        if (this.stopped) return;
        this.pending = this.pending || state;
        this.onDraft({revision:this.revision,state:this.pending});
        this.conflict = error?.code === '40001';
        this.onStatus(this.conflict ? 'conflict' : 'error', error);
        throw error;
      } finally { this.saving = null; }
    })();
    await this.saving;
    return this.stopped ? false : this.pending ? this.flush() : true;
  }
  stop() { this.stopped = true; clearTimeout(this.timer); }
  get dirty() { return !!(this.pending || this.saving); }
}
