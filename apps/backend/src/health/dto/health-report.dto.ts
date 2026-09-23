import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── GET /health/contracts ────────────────────────────────────────────────────

export class ContractReadMethodHealthDto {
  @ApiProperty({
    description: 'Read-only contract method probed',
    example: 'get_admin',
  })
  method: string;

  @ApiProperty({
    description: 'Probe result',
    enum: ['ok', 'failed', 'restore_required'],
    example: 'ok',
  })
  status: 'ok' | 'failed' | 'restore_required';

  @ApiPropertyOptional({
    description: 'Returned ScVal type',
    example: 'address',
  })
  returnType?: string;

  @ApiPropertyOptional({ description: 'Failure explanation' })
  message?: string;
}

export class ContractHealthResultDto {
  @ApiProperty({
    description: 'Logical contract name',
    enum: [
      'lumenToken',
      'crowdfundVault',
      'projectRegistry',
      'contributorRegistry',
      'matchingPool',
      'treasury',
    ],
    example: 'crowdfundVault',
  })
  name: string;

  @ApiProperty({
    description: 'Environment variable holding the contract ID',
    example: 'STELLAR_CONTRACT_CROWDFUND_VAULT',
  })
  envVar: string;

  @ApiProperty({
    description: 'Whether the contract ID is configured',
    example: true,
  })
  configured: boolean;

  @ApiProperty({
    description: 'Contract status',
    enum: ['reachable', 'misconfigured', 'unreachable'],
    example: 'reachable',
  })
  status: 'reachable' | 'misconfigured' | 'unreachable';

  @ApiPropertyOptional({ description: 'Configured contract ID' })
  contractId?: string;

  @ApiProperty({
    description: 'Per-method read probe results',
    type: [ContractReadMethodHealthDto],
  })
  readMethods: ContractReadMethodHealthDto[];

  @ApiPropertyOptional({ description: 'Failure explanation' })
  message?: string;
}

export class ContractHealthSummaryDto {
  @ApiProperty({ example: 6 }) total: number;
  @ApiProperty({ example: 6 }) reachable: number;
  @ApiProperty({ example: 0 }) misconfigured: number;
  @ApiProperty({ example: 0 }) unreachable: number;
}

export class ContractHealthReportDto {
  @ApiProperty({
    description: 'Overall status',
    enum: ['ok', 'error'],
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({ type: ContractHealthSummaryDto })
  summary: ContractHealthSummaryDto;

  @ApiProperty({ enum: ['testnet', 'mainnet'], example: 'testnet' })
  network: 'testnet' | 'mainnet';

  @ApiProperty({
    description: 'ISO timestamp of the check',
    example: '2026-01-01T00:00:00.000Z',
  })
  checkedAt: string;

  @ApiProperty({ type: [ContractHealthResultDto] })
  contracts: ContractHealthResultDto[];
}

// ── GET /health/latency ──────────────────────────────────────────────────────

export class LatencyBudgetThresholdDto {
  @ApiProperty({
    description: 'Latency (ms) above which the dependency is degraded',
    example: 1000,
  })
  degradedMs: number;

  @ApiProperty({
    description: 'Latency (ms) above which the dependency is hard-down',
    example: 5000,
  })
  hardDownMs: number;
}

export class DependencyLatencyResultDto {
  @ApiProperty({ description: 'Dependency name', example: 'horizon' })
  name: string;

  @ApiProperty({
    description: 'URL that was probed',
    example: 'https://horizon-testnet.stellar.org',
  })
  url: string;

  @ApiPropertyOptional({
    description: 'Measured round-trip time in ms; absent when unreachable',
    example: 180,
  })
  latencyMs: number | undefined;

  @ApiProperty({ type: LatencyBudgetThresholdDto })
  thresholds: LatencyBudgetThresholdDto;

  @ApiProperty({ enum: ['ok', 'degraded', 'hard_down'], example: 'ok' })
  state: 'ok' | 'degraded' | 'hard_down';

  @ApiPropertyOptional({ description: 'Human-readable explanation' })
  message?: string;
}

export class LatencyBudgetReportDto {
  @ApiProperty({
    description: 'Worst state across all dependencies',
    enum: ['ok', 'degraded', 'hard_down'],
    example: 'ok',
  })
  overallState: 'ok' | 'degraded' | 'hard_down';

  @ApiProperty({
    description: 'ISO timestamp of the check',
    example: '2026-01-01T00:00:00.000Z',
  })
  checkedAt: string;

  @ApiProperty({ type: [DependencyLatencyResultDto] })
  dependencies: DependencyLatencyResultDto[];
}

// ── GET /health/smoke ────────────────────────────────────────────────────────

export class DeploymentSmokeCheckDto {
  @ApiProperty({
    description: 'Stable check identifier',
    example: 'dependency.database',
  })
  id: string;

  @ApiProperty({
    enum: ['config', 'dependency', 'contract'],
    example: 'dependency',
  })
  category: 'config' | 'dependency' | 'contract';

  @ApiProperty({ enum: ['pass', 'warn', 'fail'], example: 'pass' })
  status: 'pass' | 'warn' | 'fail';

  @ApiProperty({
    description: 'Fixed, non-sensitive explanation',
    example: 'Database reachable',
  })
  message: string;
}

export class DeploymentSmokeSummaryDto {
  @ApiProperty({ example: 12 }) total: number;
  @ApiProperty({ example: 11 }) passed: number;
  @ApiProperty({ example: 1 }) warned: number;
  @ApiProperty({ example: 0 }) failed: number;
}

export class DeploymentSmokeReportDto {
  @ApiProperty({
    description: 'Worst status across all checks',
    enum: ['pass', 'warn', 'fail'],
    example: 'pass',
  })
  status: 'pass' | 'warn' | 'fail';

  @ApiProperty({ description: 'True unless something failed', example: true })
  ready: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  checkedAt: string;

  @ApiProperty({ example: 350 })
  durationMs: number;

  @ApiProperty({ example: 'testnet' })
  network: string;

  @ApiProperty({ example: 'production' })
  environment: string;

  @ApiProperty({ type: DeploymentSmokeSummaryDto })
  summary: DeploymentSmokeSummaryDto;

  @ApiProperty({ type: [DeploymentSmokeCheckDto] })
  checks: DeploymentSmokeCheckDto[];
}
