import { evaluate, pieceWiseColonise } from './main'

let best_threshold = 0
let best_k = 0
let best_value = 0

for (let threshold = 0; threshold < 1; threshold += 0.01) {
  for (let k = 0; k < 1; k += 0.01) {
    let result = evaluate(
      {
        colonizationCost: 5,
        colonizationDelay: 50,
        baseLogistic: true,
        baseCapacity: 50,
        colonyLogistic: true,
        colonyCapacity: 20,
      },
      pieceWiseColonise(threshold, k),
      120,
    )
    if (
      result[result.length - 1].baseProductivity +
        result[result.length - 1].colonyProductivity >
      best_value
    ) {
      best_threshold = threshold
      best_k = k
      best_value =
        result[result.length - 1].baseProductivity +
        result[result.length - 1].colonyProductivity
    }
  }
}

console.log('Best threshold:', best_threshold)
console.log('Best k:', best_k)
console.log('Best value:', best_value)
