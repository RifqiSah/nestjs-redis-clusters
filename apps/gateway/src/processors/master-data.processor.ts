import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('data-master-queue')
export class DataMasterProcessor extends WorkerHost {
  /**
   * MAIN ENTRY POINT
   * Semua job MASUK ke sini
   */
  async process(job: Job) {
    switch (job.name) {
      case 'sync-master-data':
        return this.syncMasterData(job);

      case 'cleanup-old-data':
        return this.cleanupOldData(job);

      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  /**
   * JOB HANDLER #1
   */
  private async syncMasterData(job: Job) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { source } = job.data;

    // contoh update progress
    await job.updateProgress(10);

    console.log('[sync-master-data] start', source);

    // simulasi proses
    await this.delay(1000);

    await job.updateProgress(80);

    console.log('[sync-master-data] done');

    return { status: 'ok' };
  }

  /**
   * JOB HANDLER #2
   */
  private async cleanupOldData(job: Job) {
    console.log('[cleanup-old-data] running');

    await this.delay(500);

    return { deleted: 123 };
  }

  /**
   * EVENT: job berhasil
   */
  onCompleted(job: Job, result: any) {
    console.log('[COMPLETED]', job.name, 'jobId:', job.id, 'result:', result);
  }

  /**
   * EVENT: job gagal
   */
  onFailed(job: Job, err: Error) {
    console.error(
      '[FAILED]',
      job.name,
      'jobId:',
      job.id,
      'error:',
      err.message,
    );
  }

  /**
   * EVENT: job mulai diproses
   */
  onActive(job: Job) {
    console.log('[ACTIVE]', job.name, 'jobId:', job.id);
  }

  /**
   * EVENT: progress berubah
   */
  onProgress(job: Job, progress: number) {
    console.log('[PROGRESS]', job.name, progress);
  }

  /**
   * Helper
   */
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
