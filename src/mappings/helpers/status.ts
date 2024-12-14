import { BigInt, TypedMap } from '@graphprotocol/graph-ts';
import { QuestChain, Quest, QuestStatus } from '../../types/schema';

function questChainCompletedByUser(
  chainId: string,
  questCount: i32,
  questerId: string,
): boolean {
  if (questCount == 0) return false;

  let atLeastOnePassed = false;

  for (let questIdx = 0; questIdx < questCount; questIdx++) {
    let questId = chainId
      .concat('-')
      .concat(BigInt.fromI32(questIdx).toHexString());
    let quest = Quest.load(questId);
    if (quest == null) return false;

    let questStatusId = questId.concat('-').concat(questerId);
    let questStatus = QuestStatus.load(questStatusId);
    if (
      !(quest.optional || quest.paused) &&
      (questStatus == null || questStatus.status != 'pass')
    )
      return false;

    if (questStatus != null && questStatus.status == 'pass')
      atLeastOnePassed = true;
  }

  return atLeastOnePassed;
}

export function updateQuestChainCompletions(
  questChain: QuestChain,
): QuestChain {
  let completed = new TypedMap<string, boolean>();

  for (let i = 0; i < questChain.questers.length; i++) {
    const questerId = questChain.questers[i];
    const hasCompleted = questChainCompletedByUser(
      questChain.id,
      questChain.totalQuestCount,
      questerId,
    );

    completed.set(questerId, hasCompleted);
  }

  let completedQuesters = new Array<string>();

  const completedEntries = completed.entries;
  for (let i = 0; i < completedEntries.length; i++) {
    const entry = completedEntries[i];
    if (entry.value) {
      let questerId = entry.key;
      completedQuesters.push(questerId);
    }
  }

  questChain.completedQuesters = completedQuesters;
  questChain.numCompletedQuesters = completedQuesters.length;

  return questChain;
}
