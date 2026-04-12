import { neverColonize, porportionalColonize, type Strategy } from '.'

export const pieceWiseColonise =
  (threshold: number, k: number): Strategy =>
  (state, constants, currentGeneration) => {
    if (!constants.baseLogistic || !constants.baseCapacity) {
      return {
        baseInvestment: state.baseProductivity,
        colonyInvestment: 0,
      }
    }
    if (state.baseProductivity / constants.baseCapacity > threshold) {
      return porportionalColonize(k)(state, constants, currentGeneration)
    }
    return neverColonize(state, constants, currentGeneration)
  }
