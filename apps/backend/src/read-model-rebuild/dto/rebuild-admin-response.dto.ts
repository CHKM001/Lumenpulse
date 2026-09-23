import { ApiProperty } from '@nestjs/swagger';
import { RebuildDataset } from '../entities/read-model-rebuild-job.entity';

/** Result of cancelling a rebuild job. */
export class CancelRebuildJobResponseDto {
  @ApiProperty({ description: 'Whether the job was cancelled', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Job 3f1c2d7e-... cancelled',
  })
  message: string;
}

/** Result of purging old terminal rebuild jobs. */
export class CleanupRebuildJobsResponseDto {
  @ApiProperty({ description: 'Number of job records deleted', example: 12 })
  deleted: number;
}

/** A dataset that can be rebuilt. */
export class RebuildDatasetInfoDto {
  @ApiProperty({
    description:
      'Dataset identifier (use as `dataset` when triggering a rebuild)',
    enum: RebuildDataset,
    example: RebuildDataset.KPI_SNAPSHOTS,
  })
  name: RebuildDataset;

  @ApiProperty({
    description: 'What the dataset contains',
    example: 'Daily KPI snapshots (TVL, Volume)',
  })
  description: string;
}

/** Datasets available for rebuild. */
export class RebuildDatasetListResponseDto {
  @ApiProperty({
    description: 'Rebuildable datasets',
    type: [RebuildDatasetInfoDto],
  })
  datasets: RebuildDatasetInfoDto[];
}
