/** Small client-side guard for the backend's one-heavy-analysis contract. */
export class SubmissionGate {
  private active = false;

  acquire() {
    if (this.active) {
      return false;
    }

    this.active = true;
    return true;
  }

  release() {
    this.active = false;
  }

  reset() {
    this.release();
  }
}
