import { log, Address, BigInt } from '@graphprotocol/graph-ts'
import {
  QuestChainEdit,
  QuestChain,
  QuestEdit,
  QuestStatus,
  ProofSubmission,
  ReviewSubmission,
} from '../../types/schema'
import {
  QuestMetadata,
  QuestChainMetadata,
  SubmissionMetadata,
} from '../../types/templates'
import {
  QuestChainInit as QuestChainInitEvent,
  QuestChainEdited as QuestChainEditedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
  QuestsCreated as QuestsCreatedEvent,
  QuestsEdited as QuestsEditedEvent,
  QuestProofsSubmitted as QuestProofsSubmittedEvent,
  QuestProofsReviewed as QuestProofsReviewedEvent,
  ConfiguredQuests as ConfiguredQuestsEvent,
} from '../../types/templates/QuestChainV2/QuestChainV2'
import {
  createQuest,
  getQuest,
  getQuestChain,
  getUser,
  removeFromArray,
  updateQuestChainCompletions,
} from '../helpers'
import { getRoles } from './roles'
import { stripProtocol } from '../helpers/ipfs'

export function handleChainInit(event: QuestChainInitEvent): void {
  const chain = getQuestChain(event.address)

  const details = event.params.details
  chain.details = details
  QuestChainMetadata.create(stripProtocol(details))
  chain.paused = event.params.paused

  const creator = Address.fromBytes(chain.createdBy)
  for (let i = 0; i < event.params.quests.length; i++) {
    const details = event.params.quests[i]
    const quest = createQuest(
      event.address,
      BigInt.fromI32(i),
      details,
      creator,
      event,
    )

    quest.save()
  }

  chain.questCount = event.params.quests.length
  chain.totalQuestCount = event.params.quests.length

  chain.save()
}

export function handleChainEdited(event: QuestChainEditedEvent): void {
  const chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    log.info('handleChainEdited {}', [event.address.toHexString()])

    const chainEditId = event.address
      .toHexString()
      .concat('-')
      .concat(event.block.timestamp.toHexString())
      .concat('-')
      .concat(event.logIndex.toHexString())
    const user = getUser(event.params.editor)

    const chainEdit = new QuestChainEdit(chainEditId)
    chainEdit.details = chain.details
    chainEdit.timestamp = event.block.timestamp
    chainEdit.txHash = event.transaction.hash
    chainEdit.questChain = chain.id
    chainEdit.editor = user.id
    chainEdit.save()

    const details = event.params.details
    chain.details = details
    QuestChainMetadata.create(stripProtocol(details))
    chain.editedBy = user.id
    chain.editedAt = event.block.timestamp
    chain.updatedAt = event.block.timestamp

    chain.save()
  }
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  const chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    let user = getUser(event.params.account)
    let roles = getRoles(event.address)
    if (event.params.role == roles[0]) {
      // OWNER
      let newArray = chain.owners
      newArray.push(user.id)
      chain.owners = newArray
    } else if (event.params.role == roles[1]) {
      // ADMIN
      let newArray = chain.admins
      newArray.push(user.id)
      chain.admins = newArray
    } else if (event.params.role == roles[2]) {
      // EDITOR
      let newArray = chain.editors
      newArray.push(user.id)
      chain.editors = newArray
    } else if (event.params.role == roles[3]) {
      // REVIEWER
      let newArray = chain.reviewers
      newArray.push(user.id)
      chain.reviewers = newArray
    }
    chain.save()
  }
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  const chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    let user = getUser(event.params.account)
    let roles = getRoles(event.address)
    if (event.params.role == roles[0]) {
      // OWNER
      let owners = chain.owners
      let newArray = removeFromArray(owners, user.id)
      chain.owners = newArray
    } else if (event.params.role == roles[1]) {
      // ADMIN
      let admins = chain.admins
      let newArray = removeFromArray(admins, user.id)
      chain.admins = newArray
    } else if (event.params.role == roles[2]) {
      // EDITOR
      let editors = chain.admins
      let newArray = removeFromArray(editors, user.id)
      chain.editors = newArray
    } else if (event.params.role == roles[3]) {
      // REVIEWER
      let reviewers = chain.admins
      let newArray = removeFromArray(reviewers, user.id)
      chain.reviewers = newArray
    }
    chain.save()
  }
}

export function handlePaused(event: PausedEvent): void {
  const chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    chain.paused = true
    chain.save()
  }
}

export function handleUnpaused(event: UnpausedEvent): void {
  const chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    chain.paused = false
    chain.save()
  }
}

export function handleQuestsCreated(event: QuestsCreatedEvent): void {
  let chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    const totalQuestCount = chain.totalQuestCount
    const creator = Address.fromBytes(chain.createdBy)

    for (let i = 0; i < event.params.detailsList.length; i++) {
      const questIndex = BigInt.fromI32(totalQuestCount + i)
      const details = event.params.detailsList[i]
      const quest = createQuest(
        event.address,
        questIndex,
        details,
        creator,
        event,
      )

      quest.save()
    }

    const questCount = chain.questCount
    chain.questCount = questCount + event.params.detailsList.length

    chain.totalQuestCount = totalQuestCount + event.params.detailsList.length
    chain = updateQuestChainCompletions(chain)
    chain.save()
  }
}

export function handleConfiguredQuests(event: ConfiguredQuestsEvent): void {
  let chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    let questCount = chain.questCount

    for (let i = 0; i < event.params.questIdList.length; ++i) {
      let questIndex = event.params.questIdList[i]
      let quest = getQuest(event.address, questIndex)
      quest.optional = event.params.questDetails[i].optional
      quest.skipReview = event.params.questDetails[i].skipReview

      if (event.params.questDetails[i].paused && !quest.paused) {
        questCount = questCount - 1
      } else if (!event.params.questDetails[i].paused && quest.paused) {
        questCount = questCount + 1
      }

      quest.paused = event.params.questDetails[i].paused
      quest.save()
    }

    chain.questCount = questCount
    chain = updateQuestChainCompletions(chain)
    chain.save()
  }
}

export function handleQuestsEdited(event: QuestsEditedEvent): void {
  let chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    for (let i = 0; i < event.params.questIdList.length; ++i) {
      const questIndex = event.params.questIdList[i]
      const details = event.params.detailsList[i]
      const quest = getQuest(event.address, questIndex)

      const questEditId = quest.id
        .concat('-')
        .concat(event.block.timestamp.toHexString())
        .concat('-')
        .concat(event.logIndex.toHexString())
      const user = getUser(event.params.editor)

      const questEdit = new QuestEdit(questEditId)
      questEdit.details = quest.details
      questEdit.timestamp = event.block.timestamp
      questEdit.txHash = event.transaction.hash
      questEdit.quest = quest.id
      questEdit.editor = user.id
      questEdit.save()

      quest.details = details

      QuestMetadata.create(stripProtocol(details))
      quest.editedBy = user.id
      quest.editedAt = event.block.timestamp
      quest.updatedAt = event.block.timestamp

      quest.editedAt = event.block.timestamp
      quest.editedBy = user.id

      user.save()
      quest.save()
    }
  }
}

export function handleQuestProofsSubmitted(
  event: QuestProofsSubmittedEvent,
): void {
  let chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    const user = getUser(event.params.quester)
    for (let i = 0; i < event.params.questIdList.length; i++) {
      const questIndex = event.params.questIdList[i]
      const details = event.params.proofList[i]
      const quest = getQuest(event.address, questIndex)

      const statusId = quest.id.concat('-').concat(user.id.toHexString())
      let status = QuestStatus.load(statusId)
      if (status == null) {
        status = new QuestStatus(statusId)
        status.questChain = chain.id
        status.quest = quest.id
        status.user = user.id
        status.submissions = new Array<string>()
      } else {
        let questsFailed = chain.questsFailed
        let newArray = removeFromArray(questsFailed, statusId)
        chain.questsFailed = newArray

        questsFailed = user.questsFailed
        newArray = removeFromArray(questsFailed, statusId)
        user.questsFailed = newArray

        let usersFailed = quest.usersFailed
        newArray = removeFromArray(usersFailed, statusId)
        quest.usersFailed = newArray

        let usersInReview = quest.usersInReview
        newArray = removeFromArray(usersInReview, statusId)
        quest.usersInReview = newArray

        let questsInReview = user.questsInReview
        newArray = removeFromArray(questsInReview, statusId)
        user.questsInReview = newArray

        questsInReview = chain.questsInReview
        newArray = removeFromArray(questsInReview, statusId)
        chain.questsInReview = newArray
      }

      if (quest.skipReview) {
        let questsPassed = chain.questsPassed
        questsPassed.push(statusId)
        chain.questsPassed = questsPassed

        questsPassed = user.questsPassed
        questsPassed.push(statusId)
        user.questsPassed = questsPassed

        let usersPassed = quest.usersPassed
        usersPassed.push(statusId)
        quest.usersPassed = usersPassed

        status.status = 'pass'
      } else {
        let usersInReview = quest.usersInReview
        usersInReview.push(status.id)
        quest.usersInReview = usersInReview

        let questsInReview = user.questsInReview
        questsInReview.push(status.id)
        user.questsInReview = questsInReview

        questsInReview = chain.questsInReview
        questsInReview.push(status.id)
        chain.questsInReview = questsInReview

        status.status = 'review'
      }

      let proofId = status.id
        .concat('-')
        .concat('proof')
        .concat('-')
        .concat(event.block.timestamp.toHexString())
        .concat('-')
        .concat(event.logIndex.toHexString())
      let proof = new ProofSubmission(proofId)
      proof.details = details
      SubmissionMetadata.create(stripProtocol(details))

      proof.quest = quest.id
      proof.questChain = chain.id
      proof.questStatus = status.id
      proof.timestamp = event.block.timestamp
      proof.txHash = event.transaction.hash
      proof.user = user.id

      let submissions = status.submissions
      submissions.push(proof.id)
      status.submissions = submissions

      let questers = quest.questers
      questers = removeFromArray(questers, user.id) // to remove duplicates
      questers.push(user.id)
      quest.questers = questers
      quest.numQuesters = questers.length

      proof.save()
      status.updatedAt = event.block.timestamp
      status.save()

      if (status.status === 'pass') {
        let completedQuesters = quest.completedQuesters
        completedQuesters = removeFromArray(completedQuesters, user.id) // to remove duplicates
        completedQuesters.push(user.id)
        quest.completedQuesters = completedQuesters
        quest.numCompletedQuesters = completedQuesters.length
      }

      quest.save()
    }
    user.save()
    let questers = chain.questers
    questers = removeFromArray(questers, user.id) // to remove duplicates
    questers.push(user.id)
    chain.questers = questers
    chain.numQuesters = questers.length

    chain = updateQuestChainCompletions(chain)
    chain.save()
  }
}

export function handleQuestProofsReviewed(
  event: QuestProofsReviewedEvent,
): void {
  let chain = QuestChain.load(event.address.toHexString())
  if (chain != null) {
    let reviewer = getUser(event.params.reviewer)
    for (let i = 0; i < event.params.questIdList.length; ++i) {
      let questIndex = event.params.questIdList[i]
      let quest = getQuest(event.address, questIndex)

      let quester = event.params.questerList[i]
      let success = event.params.successList[i]
      let details = event.params.detailsList[i]
      let user = getUser(quester)

      let questStatusId = quest.id.concat('-').concat(user.id.toHexString())
      let questStatus = QuestStatus.load(questStatusId)
      if (questStatus == null) {
        questStatus = new QuestStatus(questStatusId)
        questStatus.questChain = chain.id
        questStatus.quest = quest.id
        questStatus.user = user.id
      }

      let usersInReview = quest.usersInReview
      let newArray = removeFromArray(usersInReview, questStatusId)
      quest.usersInReview = newArray

      let questsInReview = user.questsInReview
      newArray = removeFromArray(questsInReview, questStatusId)
      user.questsInReview = newArray

      questsInReview = chain.questsInReview
      newArray = removeFromArray(questsInReview, questStatusId)
      chain.questsInReview = newArray

      if (success) {
        questStatus.status = 'pass'

        let questsPassed = chain.questsPassed
        questsPassed.push(questStatusId)
        chain.questsPassed = questsPassed

        questsPassed = user.questsPassed
        questsPassed.push(questStatusId)
        user.questsPassed = questsPassed

        let usersPassed = quest.usersPassed
        usersPassed.push(questStatusId)
        quest.usersPassed = usersPassed
      } else {
        questStatus.status = 'fail'

        let questsFailed = chain.questsFailed
        questsFailed.push(questStatusId)
        chain.questsFailed = questsFailed

        questsFailed = user.questsFailed
        questsFailed.push(questStatusId)
        user.questsFailed = questsFailed

        let usersFailed = quest.usersFailed
        usersFailed.push(questStatusId)
        quest.usersFailed = usersFailed
      }

      let reviewId = questStatus.id
        .concat('-')
        .concat('review')
        .concat('-')
        .concat(event.block.timestamp.toHexString())
        .concat('-')
        .concat(event.logIndex.toHexString())
      let review = new ReviewSubmission(reviewId)
      review.details = details
      SubmissionMetadata.create(stripProtocol(details))

      review.quest = quest.id
      review.questChain = chain.id
      review.questStatus = questStatus.id

      review.accepted = success

      let submissions = questStatus.submissions
      if (submissions.length > 0) {
        review.proof = submissions[submissions.length - 1]
      }

      review.timestamp = event.block.timestamp
      review.txHash = event.transaction.hash
      review.user = user.id
      review.reviewer = reviewer.id

      review.save()
      questStatus.updatedAt = event.block.timestamp
      questStatus.save()

      if (success) {
        let completedQuesters = quest.completedQuesters
        completedQuesters = removeFromArray(completedQuesters, user.id) // to remove duplicates
        completedQuesters.push(user.id)
        quest.completedQuesters = completedQuesters
        quest.numCompletedQuesters = completedQuesters.length
      }

      user.save()
      quest.save()
    }
    reviewer.save()
    chain = updateQuestChainCompletions(chain)
    chain.save()
  }
}
