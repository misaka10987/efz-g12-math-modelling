export interface Constants {
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

export const pieceWiseColonise =
  (threshold: number, k: number): Strategy =>
  (state, constants) => {
    if (!constants.baseLogistic || !constants.baseCapacity) {
      return {
        baseInvestment: state.baseProductivity,
        colonyInvestment: 0,
      }
    }
    if (state.baseProductivity / constants.baseCapacity > threshold) {
      return porportionalColonize(k)(state, constants)
    }
    return neverColonize(state, constants)
  }

export const differentialGreedyColonize: Strategy = (state, constants) => {
  const baseLogisticFactor = constants.baseLogistic
    ? 1 - state.baseProductivity / (constants.baseCapacity ?? Infinity)
    : 1

  const colonyLogisticFactor = constants.colonyLogistic
    ? 1 - state.colonyProductivity / (constants.colonyCapacity ?? Infinity)
    : 1

  const diffBase = baseLogisticFactor

  const diffColony = colonyLogisticFactor / constants.colonizationCost

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

  // if (diffBase > colonyGrowth) {
  //   return {
  //     baseInvestment: state.baseProductivity,
  //     colonyInvestment: 0,
  //   }
  // } else {
  //   return {
  //     baseInvestment: 0,
  //     colonyInvestment: state.baseProductivity,
  //   }
  // }
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
  let decisions: Decision[] = []
  for (
    let currentGeneration = 0;
    currentGeneration < generation;
    currentGeneration++
  ) {
    const generationGrowth = 2 ** (1 / 12) - 1

    const decision = strategy(state, constants)
    if (
      decision.baseInvestment + decision.colonyInvestment >
      state.baseProductivity
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
