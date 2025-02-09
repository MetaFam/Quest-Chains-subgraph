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

  return name
    .toLowerCase()
    .concat(' ')
    .concat((description as string).toLowerCase())
}

export function hexToI32(hex: string): i32 {
  let base = 10
  if (hex.startsWith('0x')) {
    hex = hex.slice(2)
    base = 16
  } else if (hex.startsWith('0b')) {
    hex = hex.slice(2)
    base = 2
  }

  return parseInt(hex, base) as i32
}
