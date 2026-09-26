import type { GamificationProfile } from "@/domains/gamification";
import type { StudyTask } from "@/domains/planning";

export type CompleteStudyTaskResult = {
  task: StudyTask;
  gamification: GamificationProfile;
  missionCompleted: boolean;
};

export interface StudyTaskRewardRepository {
  completeWithReward(taskId: string): Promise<CompleteStudyTaskResult>;
}

export async function completeStudyTask(
  repository: StudyTaskRewardRepository,
  ownerId: string,
  taskId: string,
): Promise<CompleteStudyTaskResult> {
  const result = await repository.completeWithReward(taskId);

  if (result.task.ownerId !== ownerId) {
    throw new Error("Tarefa não encontrada.");
  }

  return result;
}
