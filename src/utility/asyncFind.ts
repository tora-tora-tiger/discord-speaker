async function asyncFind<T>(
  array: Array<T>,
  asyncCallback: (item: T) => Promise<boolean>) {
  const bits = await Promise.all(array.map(asyncCallback));
  return array.find((_, i) => bits[i]);
}

export default asyncFind;