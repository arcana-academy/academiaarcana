import type {
  GamificationProfile,
  GamificationRepository,
} from "@/domains/gamification";
import type { StudyTask, StudyTaskRepository } from "@/domains/planning";

const DAILY_MISSION_CODE = "complete-study-task";
const DAILY_MISSION_TITLE = "Concluir uma tarefa de estudo";
const DAILY_MISSION_XP = 10;

type CompleteStudyTaskResult = {
  task: StudyTask;
  gamification: GamificationProfile;
  missionCompleted: boolean;
};

export async function completeStudyTask(
  taskRepository: StudyTaskRepository,
  gamificationRepository: GamificationRepository,
  ownerId: string,
  taskId: string,
  now = new Date(),
): Promise<CompleteStudyTaskResult> {
  const task = await taskRepository.getById(taskId);

  if (!task || task.ownerId !== ownerId) {
    throw new Error("Tarefa não encontrada.");
  }

  const completed = await taskRepository.complete(task.id, now.toISOString());

  if (!completed) {
    const current = await taskRepository.getById(task.id);
    if (!current) throw new Error("Tarefa não encontrada.");

    return {
      task: current,
      gamification: await gamificationRepository.getProfile(ownerId),
      missionCompleted: false,
    };
  }

  const activeOn = now.toISOString().slice(0, 10);
  const mission = await gamificationRepository.ensureDailyMission(
    ownerId,
    DAILY_MISSION_CODE,
    activeOn,
    DAILY_MISSION_TITLE,
    DAILY_MISSION_XP,
  );
  const completedMission = await gamificationRepository.completeMission(
    mission.id,
    now.toISOString(),
  );

  const gamification = completedMission
    ? await gamificationRepository.addXp(ownerId, DAILY_MISSION_XP, activeOn)
    : await gamificationRepository.getProfile(ownerId);

  return {
    task: completed,
    gamification,
    missionCompleted: Boolean(completedMission),
  };
}
