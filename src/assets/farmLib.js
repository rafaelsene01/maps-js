function shuffle(array) {
  let instance = array.length,
    aux_value,
    index_rand;

  while (0 !== instance) {
    index_rand = Math.floor(Math.random() * instance);
    instance -= 1;

    aux_value = array[instance];
    array[instance] = array[index_rand];
    array[index_rand] = aux_value;
  }

  return array;
}

export const randHexadecimalColor = () => {
  return `#${shuffle([
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
  ])
    .slice(0, 6)
    .join("")}`;
};

export const invertLatLong = (data) => {
  return data.map((arr) => {
    return [arr[1], arr[0]];
  });
};
