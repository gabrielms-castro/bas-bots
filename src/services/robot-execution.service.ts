import { NotFoundError } from '../api/errors';

export class RobotExecutionService {
  constructor(private db: Database) {}

  async executeRobot(instanceId: string, userId: string) {
    // 1. Validar instância
    const instance = await getRobotInstance(this.db, instanceId, userId);
    if (!instance) throw new NotFoundError('Instância não encontrada');

    // 2. Criar execução
    const execution = await createExecution(this.db, {
      robotInstanceId: instanceId,
      userId: userId,
      executionType: 'manual',
      status: 'pending',
    });

    // 3. Iniciar robô
    this.startRobotAsync(execution.id, instance);

    return execution;
  }

  private async startRobotAsync(executionId: string, instance: RobotInstance) {
    // Execução assíncrona do robô
    // ...
  }
}
