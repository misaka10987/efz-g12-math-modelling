export const GENERATION_GROWTH = 2 ** (1 / 12) - 1

export interface Constants {
  generation: number
  colonizationCost: number
  colonizationDelay: number
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

export type Strategy = (
  state: CurrentState,
  constants: Constants,
  currentGeneration: number,
) => Decision

export const neverColonize: Strategy = (
  state,
  constants,
  currentGeneration,
) => {
  return {
    baseInvestment: state.baseProductivity,
    colonyInvestment: 0,
  }
}

export const porportionalColonize =
  (k: number): Strategy =>
  (state, constants, currentGeneration) => {
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
): CurrentState[] => {
  const state: CurrentState = {
    baseProductivity: 1,
    colonyProductivity: 0,
  }
  let data = [structuredClone(state)]
  let decisions: Decision[] = []
  for (
    let currentGeneration = 0;
    currentGeneration < constants.generation;
    currentGeneration++
  ) {
    const generationGrowth = 2 ** (1 / 12) - 1

    const decision = strategy(state, constants, currentGeneration)
    if (
      decision.baseInvestment + decision.colonyInvestment >
        state.baseProductivity + 0.001 || // float precision
      decision.baseInvestment < 0 ||
      decision.colonyInvestment < 0
    ) {
      throw new Error()
    }

    decisions.push(structuredClone(decision))

    const baseLogisticFactor = constants.baseLogistic
      ? 1 - state.baseProductivity / (constants.baseCapacity ?? Infinity)
      : 1

    state.baseProductivity +=
      generationGrowth * decision.baseInvestment * baseLogisticFactor

    const colonyLogisticFactor = constants.colonyLogistic
      ? 1 - state.colonyProductivity / (constants.colonyCapacity ?? Infinity)
      : 1

    const receivedColonyInvestment =
      currentGeneration >= constants.colonizationDelay
        ? decisions[currentGeneration - constants.colonizationDelay]
            .colonyInvestment
        : 0

    state.colonyProductivity +=
      generationGrowth *
      (receivedColonyInvestment / constants.colonizationCost +
        state.colonyProductivity) *
      colonyLogisticFactor

    data.push(structuredClone(state))
  }
  return data
}
