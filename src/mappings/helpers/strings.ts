export function removeFromArray<T>(arr: T[], item: T): T[] {
  let newArr = new Array<T>()
  for (let i = 0; i < arr.length; i = i + 1) {
    if (arr[i] != item) {
      newArr.push(arr[i])
    }
  }
  return newArr
}

export function createSearchString(
  name: string | null,
  description: string | null,
): string | null {
  if (name == null && description == null) return null

  if (description == null) {
    return (name as string).toLowerCase()
  }

  if (name == null) {
    return (description as string).toLowerCase()
  }

  return (name as string)
    .toLowerCase()
    .concat(' ')
    .concat((description as string).toLowerCase())
}
