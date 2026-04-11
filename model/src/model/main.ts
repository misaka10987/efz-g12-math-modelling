interface Constants {
  initialBaseProductivity: number
  colonizationPenalty: number
  baseCapacity: number
  colonyCapacity: number
}

interface CurrentState {
  baseProductivity: number
  colonyProductivity: number
}

interface Decision {
  baseInvestment: number
  colonyInvestment: number
}

type Strategy = (state: CurrentState, constants: Constants) => Decision

const neverColonize: Strategy = (state, constants) => {
  return {
    baseInvestment: state.baseProductivity,
    colonyInvestment: 0,
  }
}

const evaluate = (
  constants: Constants,
  strategy: Strategy,
  months: number,
): number => {
  const state: CurrentState = {
    baseProductivity: constants.initialBaseProductivity,
    colonyProductivity: 0,
  }
  for (let currentMonth = 0; currentMonth < months; currentMonth++) {
    console.info(
      `Month ${currentMonth} total productivity ${state.baseProductivity + state.colonyProductivity}`,
    )
    const decision = strategy(state, constants)
    state.baseProductivity += decision.baseInvestment
    state.colonyProductivity += decision.colonyInvestment
  }
  return state.baseProductivity + state.colonyProductivity
}

const result = evaluate(
  {
    initialBaseProductivity: 100,
    colonizationPenalty: 2,
    baseCapacity: 1000,
    colonyCapacity: 500,
  },
  neverColonize,
  12,
)

console.info(`Total productivity after 12 months: ${result}`)
