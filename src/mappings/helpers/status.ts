import { BigInt, Bytes, TypedMap } from '@graphprotocol/graph-ts'
import { Book, Chapter, ChapterStatus } from '../../types/schema'

type i32 = number

function bookCompletedByUser(
  bookId: string,
  chapterCount: i32,
  userId: Bytes,
): boolean {
  if (chapterCount == 0) return false

  let atLeastOnePassed = false

  for (
    let chapterIdx = 0;
    !atLeastOnePassed && chapterIdx < chapterCount;
    chapterIdx++
  ) {
    const chapterId = bookId
      .concat('-')
      .concat(BigInt.fromI32(chapterIdx).toHexString())
    let chapter = Chapter.load(chapterId)
    if (chapter == null) return false

    const chapterStatusId = chapterId.concat('-').concat(userId.toHexString())
    let chapterStatus = ChapterStatus.load(chapterStatusId)
    if (
      !(chapter.optional || chapter.paused) &&
      (chapterStatus == null || chapterStatus.status != 'pass')
    ) {
      return false
    }

    if (chapterStatus != null && chapterStatus.status == 'pass') {
      atLeastOnePassed = true
    }
  }

  return atLeastOnePassed
}

export function updateBookCompletions(book: Book): Book {
  let completed = new TypedMap<string, boolean>()

  for (let i = 0; i < book.users.length; i++) {
    const userId = book.users[i]
    const hasCompleted = bookCompletedByUser(
      book.id,
      book.totalChapterCount,
      userId,
    )

    completed.set(userId.toHexString(), hasCompleted)
  }

  let completedUsers = new Array<Bytes>()

  const completedEntries = completed.entries
  for (let i = 0; i < completedEntries.length; i++) {
    const entry = completedEntries[i]
    if (entry.value) {
      let userId = entry.key
      completedUsers.push(Bytes.fromHexString(userId))
    }
  }

  book.completedUsers = completedUsers
  book.numCompletedUsers = completedUsers.length

  return book
}
