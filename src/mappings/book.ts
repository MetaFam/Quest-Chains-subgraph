import { log, Address, BigInt } from '@graphprotocol/graph-ts'
import {
  BookEdit,
  Book,
  ChapterEdit,
  ChapterStatus,
  ProofSubmission,
  ReviewSubmission,
} from '../types/schema'
import {
  ChapterMetadata,
  BookMetadata,
  SubmissionMetadata,
} from '../types/templates'
import {
  BookInit as BookInitEvent,
  BookEdited as BookEditedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
  ChaptersCreated as ChaptersCreatedEvent,
  ChaptersEdited as ChaptersEditedEvent,
  ChapterProofsSubmitted as ChapterProofsSubmittedEvent,
  ChapterProofsReviewed as ChapterProofsReviewedEvent,
  ConfiguredChapters as ConfiguredChaptersEvent,
} from '../types/templates/Book/Book'
import {
  createChapter,
  getChapter,
  getBook,
  getUser,
  removeFromArray,
  updateBookCompletions,
} from './helpers'
import { getRoles } from './roles'
import { stripProtocol } from './helpers/ipfs'

export function handleChainInit(event: BookInitEvent): void {
  const chain = getBook(event.address)

  const details = event.params.details
  chain.details = details
  BookMetadata.create(stripProtocol(details))
  chain.paused = event.params.paused

  const creator = Address.fromBytes(chain.creator)
  for (let i = 0; i < event.params.chapters.length; i++) {
    const details = event.params.chapters[i]
    const chapter = createChapter(
      event.address,
      BigInt.fromI32(i),
      details,
      creator,
      event,
    )

    chapter.save()
  }

  chain.chapterCount = event.params.chapters.length
  chain.totalChapterCount = event.params.chapters.length

  chain.save()
}

export function handleChainEdited(event: BookEditedEvent): void {
  const chain = Book.load(event.address.toHexString())
  if (chain != null) {
    log.info('handleChainEdited {}', [event.address.toHexString()])

    const chainEditId = event.address
      .toHexString()
      .concat('-')
      .concat(event.block.timestamp.toHexString())
      .concat('-')
      .concat(event.logIndex.toHexString())
    const user = getUser(event.params.editor)

    const chainEdit = new BookEdit(chainEditId)
    chainEdit.details = chain.details
    chainEdit.timestamp = event.block.timestamp.toI64()
    chainEdit.txHash = event.transaction.hash
    chainEdit.book = chain.id
    chainEdit.editor = user.id
    chainEdit.save()

    const details = event.params.details
    chain.details = details
    BookMetadata.create(stripProtocol(details))
    chain.editedBy = user.id
    chain.editedAt = event.block.timestamp.toI64()
    chain.updatedAt = event.block.timestamp.toI64()

    chain.save()
  }
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  const chain = Book.load(event.address.toHexString())
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
  const chain = Book.load(event.address.toHexString())
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
  const chain = Book.load(event.address.toHexString())
  if (chain != null) {
    chain.paused = true
    chain.save()
  }
}

export function handleUnpaused(event: UnpausedEvent): void {
  const chain = Book.load(event.address.toHexString())
  if (chain != null) {
    chain.paused = false
    chain.save()
  }
}

export function handleChaptersCreated(event: ChaptersCreatedEvent): void {
  let chain = Book.load(event.address.toHexString())
  if (chain != null) {
    const totalChapterCount = chain.totalChapterCount
    const creator = Address.fromBytes(chain.creator)

    for (let i = 0; i < event.params.detailsList.length; i++) {
      const chapterIndex = BigInt.fromI32(totalChapterCount + i)
      const details = event.params.detailsList[i]
      const chapter = createChapter(
        event.address,
        chapterIndex,
        details,
        creator,
        event,
      )

      chapter.save()
    }

    const chapterCount = chain.chapterCount
    chain.chapterCount = chapterCount + event.params.detailsList.length

    chain.totalChapterCount =
      totalChapterCount + event.params.detailsList.length
    chain = updateBookCompletions(chain)
    chain.save()
  }
}

export function handleConfiguredChapters(event: ConfiguredChaptersEvent): void {
  let chain = Book.load(event.address.toHexString())
  if (chain != null) {
    let chapterCount = chain.chapterCount

    for (let i = 0; i < event.params.chapterIdList.length; ++i) {
      let chapterIndex = event.params.chapterIdList[i]
      let chapter = getChapter(event.address, chapterIndex)
      chapter.optional = event.params.chapterDetails[i].optional
      chapter.skipReview = event.params.chapterDetails[i].skipReview

      if (event.params.chapterDetails[i].paused && !chapter.paused) {
        chapterCount = chapterCount - 1
      } else if (!event.params.chapterDetails[i].paused && chapter.paused) {
        chapterCount = chapterCount + 1
      }

      chapter.paused = event.params.chapterDetails[i].paused
      chapter.save()
    }

    chain.chapterCount = chapterCount
    chain = updateBookCompletions(chain)
    chain.save()
  }
}

export function handleChaptersEdited(event: ChaptersEditedEvent): void {
  let chain = Book.load(event.address.toHexString())
  if (chain != null) {
    for (let i = 0; i < event.params.chapterIdList.length; ++i) {
      const chapterIndex = event.params.chapterIdList[i]
      const details = event.params.detailsList[i]
      const chapter = getChapter(event.address, chapterIndex)

      const chapterEditId = chapter.id
        .concat('-')
        .concat(event.block.timestamp.toHexString())
        .concat('-')
        .concat(event.logIndex.toHexString())
      const user = getUser(event.params.editor)

      const chapterEdit = new ChapterEdit(chapterEditId)
      chapterEdit.details = chapter.details
      chapterEdit.timestamp = event.block.timestamp.toI64()
      chapterEdit.txHash = event.transaction.hash
      chapterEdit.chapter = chapter.id
      chapterEdit.editor = user.id
      chapterEdit.save()

      chapter.details = details

      ChapterMetadata.create(stripProtocol(details))
      chapter.editedBy = user.id
      chapter.editedAt = event.block.timestamp.toI64()
      chapter.updatedAt = event.block.timestamp.toI64()

      user.save()
      chapter.save()
    }
  }
}

export function handleChapterProofsSubmitted(
  event: ChapterProofsSubmittedEvent,
): void {
  let chain = Book.load(event.address.toHexString())
  if (chain != null) {
    const user = getUser(event.params.user)
    for (let i = 0; i < event.params.chapterIdList.length; i++) {
      const chapterIndex = event.params.chapterIdList[i]
      const details = event.params.proofList[i]
      const chapter = getChapter(event.address, chapterIndex)

      const statusId = chapter.id.concat('-').concat(user.id.toHexString())
      let status = ChapterStatus.load(statusId)
      if (status == null) {
        status = new ChapterStatus(statusId)
        status.book = chain.id
        status.chapter = chapter.id
        status.user = user.id
        status.submissions = new Array<string>()
      } else {
        let chaptersFailed = chain.chaptersFailed
        let newArray = removeFromArray(chaptersFailed, statusId)
        chain.chaptersFailed = newArray

        chaptersFailed = user.chaptersFailed
        newArray = removeFromArray(chaptersFailed, statusId)
        user.chaptersFailed = newArray

        let usersFailed = chapter.usersFailed
        newArray = removeFromArray(usersFailed, statusId)
        chapter.usersFailed = newArray

        let usersInReview = chapter.usersInReview
        newArray = removeFromArray(usersInReview, statusId)
        chapter.usersInReview = newArray

        let chaptersInReview = user.chaptersInReview
        newArray = removeFromArray(chaptersInReview, statusId)
        user.chaptersInReview = newArray

        chaptersInReview = chain.chaptersInReview
        newArray = removeFromArray(chaptersInReview, statusId)
        chain.chaptersInReview = newArray
      }

      if (chapter.skipReview) {
        let chaptersPassed = chain.chaptersPassed
        chaptersPassed.push(statusId)
        chain.chaptersPassed = chaptersPassed

        chaptersPassed = user.chaptersPassed
        chaptersPassed.push(statusId)
        user.chaptersPassed = chaptersPassed

        let usersPassed = chapter.usersPassed
        usersPassed.push(statusId)
        chapter.usersPassed = usersPassed

        status.status = 'pass'
      } else {
        let usersInReview = chapter.usersInReview
        usersInReview.push(status.id)
        chapter.usersInReview = usersInReview

        let chaptersInReview = user.chaptersInReview
        chaptersInReview.push(status.id)
        user.chaptersInReview = chaptersInReview

        chaptersInReview = chain.chaptersInReview
        chaptersInReview.push(status.id)
        chain.chaptersInReview = chaptersInReview

        status.status = 'review'
      }

      let proofId = status.id
        .concat('-')
        .concat('proof')
        .concat('-')
        .concat(event.block.timestamp.toHexString())
        .concat('-')
        .concat(event.logIndex.toHexString())
      const proof = new ProofSubmission(proofId)
      proof.details = details
      SubmissionMetadata.create(stripProtocol(details))

      proof.chapter = chapter.id
      proof.book = chain.id
      proof.chapterStatus = status.id
      proof.timestamp = event.block.timestamp.toI64()
      proof.txHash = event.transaction.hash
      proof.user = user.id

      const submissions = status.submissions
      submissions.push(proof.id)
      status.submissions = submissions

      let users = chapter.users
      users = removeFromArray(users, user.id) // to remove duplicates
      users.push(user.id)
      chapter.users = users
      chapter.numUsers = users.length

      proof.save()
      status.updatedAt = event.block.timestamp.toI64()
      status.save()

      if (status.status === 'pass') {
        let completedUsers = chapter.completedUsers
        completedUsers = removeFromArray(completedUsers, user.id) // to remove duplicates
        completedUsers.push(user.id)
        chapter.completedUsers = completedUsers
        chapter.numCompletedUsers = completedUsers.length
      }

      chapter.save()
    }
    user.save()
    let users = chain.users
    users = removeFromArray(users, user.id) // to remove duplicates
    users.push(user.id)
    chain.users = users
    chain.numUsers = users.length

    chain = updateBookCompletions(chain)
    chain.save()
  }
}

export function handleChapterProofsReviewed(
  event: ChapterProofsReviewedEvent,
): void {
  let chain = Book.load(event.address.toHexString())
  if (chain != null) {
    let reviewer = getUser(event.params.reviewer)
    for (let i = 0; i < event.params.chapterIdList.length; ++i) {
      let chapterIndex = event.params.chapterIdList[i]
      let chapter = getChapter(event.address, chapterIndex)

      let participant = event.params.userList[i]
      let success = event.params.successList[i]
      let details = event.params.detailsList[i]
      let user = getUser(participant)

      let chapterStatusId = chapter.id.concat('-').concat(user.id.toHexString())
      let chapterStatus = ChapterStatus.load(chapterStatusId)
      if (chapterStatus == null) {
        chapterStatus = new ChapterStatus(chapterStatusId)
        chapterStatus.book = chain.id
        chapterStatus.chapter = chapter.id
        chapterStatus.user = user.id
      }

      let usersInReview = chapter.usersInReview
      let newArray = removeFromArray(usersInReview, chapterStatusId)
      chapter.usersInReview = newArray

      let chaptersInReview = user.chaptersInReview
      newArray = removeFromArray(chaptersInReview, chapterStatusId)
      user.chaptersInReview = newArray

      chaptersInReview = chain.chaptersInReview
      newArray = removeFromArray(chaptersInReview, chapterStatusId)
      chain.chaptersInReview = newArray

      if (success) {
        chapterStatus.status = 'pass'

        let chaptersPassed = chain.chaptersPassed
        chaptersPassed.push(chapterStatusId)
        chain.chaptersPassed = chaptersPassed

        chaptersPassed = user.chaptersPassed
        chaptersPassed.push(chapterStatusId)
        user.chaptersPassed = chaptersPassed

        let usersPassed = chapter.usersPassed
        usersPassed.push(chapterStatusId)
        chapter.usersPassed = usersPassed
      } else {
        chapterStatus.status = 'fail'

        let chaptersFailed = chain.chaptersFailed
        chaptersFailed.push(chapterStatusId)
        chain.chaptersFailed = chaptersFailed

        chaptersFailed = user.chaptersFailed
        chaptersFailed.push(chapterStatusId)
        user.chaptersFailed = chaptersFailed

        let usersFailed = chapter.usersFailed
        usersFailed.push(chapterStatusId)
        chapter.usersFailed = usersFailed
      }

      let reviewId = chapterStatus.id
        .concat('-')
        .concat('review')
        .concat('-')
        .concat(event.block.timestamp.toHexString())
        .concat('-')
        .concat(event.logIndex.toHexString())
      let review = new ReviewSubmission(reviewId)
      review.details = details
      SubmissionMetadata.create(stripProtocol(details))

      review.chapter = chapter.id
      review.book = chain.id
      review.chapterStatus = chapterStatus.id

      review.accepted = success

      let submissions = chapterStatus.submissions
      if (submissions.length > 0) {
        review.proof = submissions[submissions.length - 1]
      }

      review.timestamp = event.block.timestamp.toI64()
      review.txHash = event.transaction.hash
      review.user = user.id
      review.reviewer = reviewer.id

      review.save()
      chapterStatus.updatedAt = event.block.timestamp.toI64()
      chapterStatus.save()

      if (success) {
        let completedUsers = chapter.completedUsers
        completedUsers = removeFromArray(completedUsers, user.id) // to remove duplicates
        completedUsers.push(user.id)
        chapter.completedUsers = completedUsers
        chapter.numCompletedUsers = completedUsers.length
      }

      user.save()
      chapter.save()
    }
    reviewer.save()
    chain = updateBookCompletions(chain)
    chain.save()
  }
}
