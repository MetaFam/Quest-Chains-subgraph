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

export function handleBookInit(event: BookInitEvent): void {
  const book = getBook(event.address)

  const details = event.params.details
  book.details = details
  book.detailsURL = details
  BookMetadata.create(stripProtocol(details))
  log.debug('Init Book w/ Metadata: {}', [stripProtocol(details)])

  book.paused = event.params.paused

  const creator = Address.fromBytes(book.creator)
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

  book.chapterCount = event.params.chapters.length
  book.totalChapterCount = event.params.chapters.length

  book.save()
}

export function handleBookEdited(event: BookEditedEvent): void {
  const book = Book.load(event.address.toHexString())
  if (book != null) {
    log.info('handleBookEdited {}', [event.address.toHexString()])

    const bookEditId = event.address
      .toHexString()
      .concat('-')
      .concat(event.block.timestamp.toHexString())
      .concat('-')
      .concat(event.logIndex.toHexString())
    const user = getUser(event.params.editor)

    const bookEdit = new BookEdit(bookEditId)
    bookEdit.details = book.details
    bookEdit.detailsURL = book.details
    bookEdit.timestamp = event.block.timestamp.toI64()
    bookEdit.txHash = event.transaction.hash
    bookEdit.book = book.id
    bookEdit.editor = user.id
    bookEdit.save()

    const details = event.params.details
    book.details = details
    book.detailsURL = details
    BookMetadata.create(stripProtocol(details))
    book.editedBy = user.id
    book.editedAt = event.block.timestamp.toI64()
    book.updatedAt = event.block.timestamp.toI64()

    book.save()
  }
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  const book = Book.load(event.address.toHexString())
  if (book != null) {
    let user = getUser(event.params.account)
    let roles = getRoles(event.address)
    if (event.params.role == roles[0]) {
      // OWNER
      let newArray = book.owners
      newArray.push(user.id)
      book.owners = newArray
    } else if (event.params.role == roles[1]) {
      // ADMIN
      let newArray = book.admins
      newArray.push(user.id)
      book.admins = newArray
    } else if (event.params.role == roles[2]) {
      // EDITOR
      let newArray = book.editors
      newArray.push(user.id)
      book.editors = newArray
    } else if (event.params.role == roles[3]) {
      // REVIEWER
      let newArray = book.reviewers
      newArray.push(user.id)
      book.reviewers = newArray
    }
    book.save()
  }
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  const book = Book.load(event.address.toHexString())
  if (book != null) {
    let user = getUser(event.params.account)
    let roles = getRoles(event.address)
    if (event.params.role == roles[0]) {
      // OWNER
      let owners = book.owners
      let newArray = removeFromArray(owners, user.id)
      book.owners = newArray
    } else if (event.params.role == roles[1]) {
      // ADMIN
      let admins = book.admins
      let newArray = removeFromArray(admins, user.id)
      book.admins = newArray
    } else if (event.params.role == roles[2]) {
      // EDITOR
      let editors = book.admins
      let newArray = removeFromArray(editors, user.id)
      book.editors = newArray
    } else if (event.params.role == roles[3]) {
      // REVIEWER
      let reviewers = book.admins
      let newArray = removeFromArray(reviewers, user.id)
      book.reviewers = newArray
    }
    book.save()
  }
}

export function handlePaused(event: PausedEvent): void {
  const book = Book.load(event.address.toHexString())
  if (book != null) {
    book.paused = true
    book.save()
  }
}

export function handleUnpaused(event: UnpausedEvent): void {
  const book = Book.load(event.address.toHexString())
  if (book != null) {
    book.paused = false
    book.save()
  }
}

export function handleChaptersCreated(event: ChaptersCreatedEvent): void {
  let book = Book.load(event.address.toHexString())
  if (book != null) {
    const totalChapterCount = book.totalChapterCount
    const creator = Address.fromBytes(book.creator)

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

    const chapterCount = book.chapterCount
    book.chapterCount = chapterCount + event.params.detailsList.length

    book.totalChapterCount = totalChapterCount + event.params.detailsList.length
    book = updateBookCompletions(book)
    book.save()
  }
}

export function handleConfiguredChapters(event: ConfiguredChaptersEvent): void {
  let book = Book.load(event.address.toHexString())
  if (book != null) {
    let chapterCount = book.chapterCount

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

    book.chapterCount = chapterCount
    book = updateBookCompletions(book)
    book.save()
  }
}

export function handleChaptersEdited(event: ChaptersEditedEvent): void {
  let book = Book.load(event.address.toHexString())
  if (book != null) {
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
      chapterEdit.detailsURL = chapter.details
      chapterEdit.timestamp = event.block.timestamp.toI64()
      chapterEdit.txHash = event.transaction.hash
      chapterEdit.chapter = chapter.id
      chapterEdit.editor = user.id
      chapterEdit.save()

      chapter.details = details
      chapter.detailsURL = details
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
  let book = Book.load(event.address.toHexString())
  if (book != null) {
    const user = getUser(event.params.user)
    for (let i = 0; i < event.params.chapterIdList.length; i++) {
      const chapterIndex = event.params.chapterIdList[i]
      const details = event.params.proofList[i]
      const chapter = getChapter(event.address, chapterIndex)

      const statusId = chapter.id.concat('-').concat(user.id.toHexString())
      let status = ChapterStatus.load(statusId)
      if (status == null) {
        status = new ChapterStatus(statusId)
        status.book = book.id
        status.chapter = chapter.id
        status.user = user.id
        status.submissions = new Array<string>()
      } else {
        let chaptersFailed = book.chaptersFailed
        let newArray = removeFromArray(chaptersFailed, statusId)
        book.chaptersFailed = newArray

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

        chaptersInReview = book.chaptersInReview
        newArray = removeFromArray(chaptersInReview, statusId)
        book.chaptersInReview = newArray
      }

      if (chapter.skipReview) {
        let chaptersPassed = book.chaptersPassed
        chaptersPassed.push(statusId)
        book.chaptersPassed = chaptersPassed

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

        chaptersInReview = book.chaptersInReview
        chaptersInReview.push(status.id)
        book.chaptersInReview = chaptersInReview

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
      proof.detailsURL = details
      SubmissionMetadata.create(stripProtocol(details))

      proof.chapter = chapter.id
      proof.book = book.id
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
    let users = book.users
    users = removeFromArray(users, user.id) // to remove duplicates
    users.push(user.id)
    book.users = users
    book.numUsers = users.length

    book = updateBookCompletions(book)
    book.save()
  }
}

export function handleChapterProofsReviewed(
  event: ChapterProofsReviewedEvent,
): void {
  let book = Book.load(event.address.toHexString())
  if (book != null) {
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
        chapterStatus.book = book.id
        chapterStatus.chapter = chapter.id
        chapterStatus.user = user.id
      }

      let usersInReview = chapter.usersInReview
      let newArray = removeFromArray(usersInReview, chapterStatusId)
      chapter.usersInReview = newArray

      let chaptersInReview = user.chaptersInReview
      newArray = removeFromArray(chaptersInReview, chapterStatusId)
      user.chaptersInReview = newArray

      chaptersInReview = book.chaptersInReview
      newArray = removeFromArray(chaptersInReview, chapterStatusId)
      book.chaptersInReview = newArray

      if (success) {
        chapterStatus.status = 'pass'

        let chaptersPassed = book.chaptersPassed
        chaptersPassed.push(chapterStatusId)
        book.chaptersPassed = chaptersPassed

        chaptersPassed = user.chaptersPassed
        chaptersPassed.push(chapterStatusId)
        user.chaptersPassed = chaptersPassed

        let usersPassed = chapter.usersPassed
        usersPassed.push(chapterStatusId)
        chapter.usersPassed = usersPassed
      } else {
        chapterStatus.status = 'fail'

        let chaptersFailed = book.chaptersFailed
        chaptersFailed.push(chapterStatusId)
        book.chaptersFailed = chaptersFailed

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
      review.detailsURL = details
      SubmissionMetadata.create(stripProtocol(details))

      review.chapter = chapter.id
      review.book = book.id
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
    book = updateBookCompletions(book)
    book.save()
  }
}
