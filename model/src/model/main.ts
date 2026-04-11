export interface Constants {
  colonizationPenalty: number
  baseLogistic: boolean
  baseCapacity?: number
  colonyLogistic: boolean
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
    baseProductivity: 1,
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
      (1 -
        state.baseProductivity /
          (constants.baseLogistic
            ? (constants.baseCapacity ?? Infinity)
            : Infinity))
    state.colonyProductivity +=
      generationGrowth *
      (decision.colonyInvestment / constants.colonizationPenalty +
        state.colonyProductivity) *
      (1 -
        state.colonyProductivity /
          (constants.colonyLogistic
            ? (constants.colonyCapacity ?? Infinity)
            : Infinity))

    data.push(structuredClone(state))
  }
  return data
}
