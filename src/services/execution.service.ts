import { BadRequestError } from '../api/errors';
import type { ApiConfig } from '../config';
import {
  createExecution,
  type CreateExecutionParams,
  type Execution,
} from '../db/executions';
import { getRobotInstanceByID } from '../db/robot-instances';

export type CreateExecutionDTO = {
  robotInstanceID: string;
  userID: string;
  executionType: 'manual' | 'scheduled' | 'retry';
  scheduleID?: string;
};

export class ExecutionService {
  constructor(private config: ApiConfig) {}

  private async validateExecutionRules(dto: CreateExecutionDTO) {
    if (!['manual', 'scheduled', 'retry'].includes(dto.executionType)) {
      throw new BadRequestError(
        "executionType must be 'manual', 'scheduled', or 'retry'",
      );
    }

    if (dto.executionType === 'scheduled' && !dto.scheduleID) {
      throw new BadRequestError(
        'scheduleID is required for scheduled executions',
      );
    }
  }

  private async validateRobotInstance(instanceID: string, userID: string) {
    const robotInstance = await getRobotInstanceByID(
      this.config.db,
      instanceID,
    );
    if (!robotInstance || robotInstance.userID !== userID) {
      throw new BadRequestError('Robot Instance not found');
    }

    if (!robotInstance.isActive)
      throw new BadRequestError('Robot Instance is not active');
    return robotInstance;
  }

  async createExecution(dto: CreateExecutionDTO): Promise<Execution> {
    await this.validateExecutionRules(dto);
    const robotInstance = await this.validateRobotInstance(
      dto.robotInstanceID,
      dto.userID,
    );
    const params: CreateExecutionParams = {
      robotInstanceID: robotInstance.id,
      userID: dto.userID,
      executionType: dto.executionType,
      scheduleID: dto.scheduleID || null,
      status: 'pending',
    };
    const execution = await createExecution(this.config.db, params);
    if (!execution) throw new BadRequestError('Failed to create execution');
    return execution;
  }
}
