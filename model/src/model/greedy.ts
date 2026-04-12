import { GENERATION_GROWTH, porportionalColonize, type Strategy } from '.'

export const greedyColonize: Strategy = (
  state,
  constants,
  currentGeneration,
) => {
  const baseLogisticFactor = constants.baseLogistic
    ? 1 - state.baseProductivity / (constants.baseCapacity ?? Infinity)
    : 1

  const colonyLogisticFactor = constants.colonyLogistic
    ? 1 - state.colonyProductivity / (constants.colonyCapacity ?? Infinity)
    : 1

  const diffBase = baseLogisticFactor

  const diffColony =
    (colonyLogisticFactor / constants.colonizationCost) *
    (1 / (1 + GENERATION_GROWTH)) ** constants.colonizationDelay

  if (diffBase > diffColony) {
    return {
      baseInvestment: state.baseProductivity,
      colonyInvestment: 0,
    }
  } else {
    return {
      baseInvestment: 0,
      colonyInvestment: state.baseProductivity,
    }
  }
}

export const softGreedyColonize: Strategy = (
  state,
  constants,
  currentGeneration,
) => {
  const baseLogisticFactor = constants.baseLogistic
    ? 1 - state.baseProductivity / (constants.baseCapacity ?? Infinity)
    : 1

  const colonyLogisticFactor = constants.colonyLogistic
    ? 1 - state.colonyProductivity / (constants.colonyCapacity ?? Infinity)
    : 1

  const diffBase = baseLogisticFactor

  const diffColony =
    (colonyLogisticFactor / constants.colonizationCost) *
    (1 / (1 + GENERATION_GROWTH)) ** constants.colonizationDelay

  const k = diffColony / (diffBase + diffColony)

  return porportionalColonize(k)(state, constants, currentGeneration)
}
