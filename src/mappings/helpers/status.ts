import { BigInt, Bytes, TypedMap } from '@graphprotocol/graph-ts'
import { QuestChain, Quest, QuestStatus } from '../../types/schema'

function questChainCompletedByUser(
  chainId: string,
  questCount: i32,
  questerId: Bytes,
): boolean {
  if (questCount == 0) return false

  let atLeastOnePassed = false

  for (
    let questIdx = 0;
    !atLeastOnePassed && questIdx < questCount;
    questIdx++
  ) {
    const questId = chainId
      .concat('-')
      .concat(BigInt.fromI32(questIdx).toHexString())
    let quest = Quest.load(questId)
    if (quest == null) return false

    const questStatusId = questId.concat('-').concat(questerId.toHexString())
    let questStatus = QuestStatus.load(questStatusId)
    if (
      !(quest.optional || quest.paused) &&
      (questStatus == null || questStatus.status != 'pass')
    ) {
      return false
    }

    if (questStatus != null && questStatus.status == 'pass') {
      atLeastOnePassed = true
    }
  }

  return atLeastOnePassed
}

export function updateQuestChainCompletions(
  questChain: QuestChain,
): QuestChain {
  let completed = new TypedMap<string, boolean>()

  for (let i = 0; i < questChain.questers.length; i++) {
    const questerId = questChain.questers[i]
    const hasCompleted = questChainCompletedByUser(
      questChain.id,
      questChain.totalQuestCount,
      questerId,
    )

    completed.set(questerId.toHexString(), hasCompleted)
  }

  let completedQuesters = new Array<Bytes>()

  const completedEntries = completed.entries
  for (let i = 0; i < completedEntries.length; i++) {
    const entry = completedEntries[i]
    if (entry.value) {
      let questerId = entry.key
      completedQuesters.push(Bytes.fromHexString(questerId))
    }
  }

  questChain.completedQuesters = completedQuesters
  questChain.numCompletedQuesters = completedQuesters.length

  return questChain
}
