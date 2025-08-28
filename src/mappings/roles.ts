import { Bytes, Address } from '@graphprotocol/graph-ts'
import { Book as BookContract } from '../types/templates/Book/Book'

export function getRoles(address: Address): Bytes[] {
  const book = BookContract.bind(address)
  const try_DEFAULT_ADMIN_ROLE = book.try_DEFAULT_ADMIN_ROLE()
  const try_ADMIN_ROLE = book.try_ADMIN_ROLE()
  const try_EDITOR_ROLE = book.try_EDITOR_ROLE()
  const try_REVIEWER_ROLE = book.try_REVIEWER_ROLE()
  return [
    try_DEFAULT_ADMIN_ROLE.reverted
      ? Bytes.fromI32(0)
      : try_DEFAULT_ADMIN_ROLE.value,
    try_ADMIN_ROLE.reverted ? Bytes.fromI32(0) : try_ADMIN_ROLE.value,
    try_EDITOR_ROLE.reverted ? Bytes.fromI32(0) : try_EDITOR_ROLE.value,
    try_REVIEWER_ROLE.reverted ? Bytes.fromI32(0) : try_REVIEWER_ROLE.value,
  ]
}
