export interface Constants {
  initialBaseProductivity: number
  colonizationPenalty: number
  baseCapacity?: number
  colonyCapacity?: number
}

export interface CurrentState {
  baseProductivity: number
  colonyProductivity: number
}

export interface Decision {
  baseInvestment: number
  colonyInvestment: number
}

type Strategy = (state: CurrentState, constants: Constants) => Decision

export const neverColonize: Strategy = (state, constants) => {
  return {
    baseInvestment: state.baseProductivity,
    colonyInvestment: 0,
  }
}

export const porportionalColonize =
  (k: number): Strategy =>
  (state, constants) => {
    const colonyInvestment = state.baseProductivity * k
    const baseInvestment = state.baseProductivity - colonyInvestment
    return {
      baseInvestment,
      colonyInvestment,
    }
  }

export const evaluate = (
  constants: Constants,
  strategy: Strategy,
  generation: number,
): CurrentState[] => {
  const state: CurrentState = {
    baseProductivity: constants.initialBaseProductivity,
    colonyProductivity: 0,
  }
  let data = [structuredClone(state)]
  for (
    let currentGeneration = 0;
    currentGeneration < generation;
    currentGeneration++
  ) {
    const generationGrowth = 2 ** (1 / 12) - 1

    const decision = strategy(state, constants)
    // logistic growth
    state.baseProductivity +=
      generationGrowth *
      decision.baseInvestment *
      (1 - state.baseProductivity / (constants.baseCapacity ?? Infinity))
    state.colonyProductivity +=
      generationGrowth *
      (decision.colonyInvestment / constants.colonizationPenalty +
        state.colonyProductivity) *
      (1 - state.colonyProductivity / (constants.colonyCapacity ?? Infinity))

    data.push(structuredClone(state))
  }
  return data
}
