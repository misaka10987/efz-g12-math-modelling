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

type Strategy = (
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

export const eulerColonize: Strategy = (
  state,
  constants,
  currentGeneration,
) => {
  const g = GENERATION_GROWTH
  const remaining = constants.generation - currentGeneration

  // 容量因子（若无容量则视为1，但逻辑斯蒂存在时用饱和因子）
  const baseSat =
    constants.baseLogistic && constants.baseCapacity
      ? 1 - state.baseProductivity / constants.baseCapacity
      : 1
  const colonySat =
    constants.colonyLogistic && constants.colonyCapacity
      ? 1 - state.colonyProductivity / constants.colonyCapacity
      : 1

  // 基础影子价格：剩余时间内基础饱和因子的积分近似
  // 假设未来分配近似于softGreedy，则基础饱和因子随时间下降，粗略用指数衰减近似
  const lambdaBase = (baseSat * (Math.exp(g * remaining) - 1)) / g

  // 殖民地影子价格：殖民地饱和因子乘以类似积分，但考虑成本与延迟贴现
  const lambdaColony =
    (colonySat *
      (Math.exp(g * (remaining - constants.colonizationDelay)) - 1)) /
    g /
    constants.colonizationCost

  // 等边际条件：lambdaBase = u * lambdaBase + (1-u) * lambdaColony? 不对，应该是边际转换率相等
  // 一单位产出用于基础得 lambdaBase * g * B * baseSat
  // 用于殖民地得 lambdaColony * g * B * colonySat / cost * discount
  // 令两者相等，但这里lambda已经包含了积分因子，因此直接比较lambdaBase与lambdaColony * colonySat因子？

  // 实际上我们应使投资在两种用途上的边际价值增量相等：
  const marginalBase = lambdaBase * baseSat // 当前基础投资对终值的边际贡献
  const marginalColony =
    ((lambdaColony * colonySat) / constants.colonizationCost) *
    Math.pow(1 + g, -constants.colonizationDelay)

  // 投资比例应使得两者相等，但只有两个用途，我们可以采用类似soft的比例分配：
  const k = marginalColony / (marginalBase + marginalColony)

  return {
    baseInvestment: state.baseProductivity * (1 - k),
    colonyInvestment: state.baseProductivity * k,
  }
}

export const hybridColonize: Strategy = (
  state,
  constants,
  currentGeneration,
) => {
  const g = GENERATION_GROWTH
  const remaining = constants.generation - currentGeneration

  // 基础容量因子（若无容量限制则始终为 1）
  const baseSat =
    constants.baseLogistic && constants.baseCapacity
      ? Math.max(0, 1 - state.baseProductivity / constants.baseCapacity)
      : 1

  // 殖民地容量因子（若无容量限制则始终为 1）
  const colonySat =
    constants.colonyLogistic && constants.colonyCapacity
      ? Math.max(0, 1 - state.colonyProductivity / constants.colonyCapacity)
      : 1

  // 判断殖民地是否具有无限增长潜力（即无逻辑斯蒂上限或容量极大）
  const colonyHasInfiniteCapacity =
    !constants.colonyLogistic || !constants.colonyCapacity

  if (colonyHasInfiniteCapacity) {
    const cost = constants.colonizationCost
    const delay = constants.colonizationDelay
    const delayDiscount = Math.pow(1 + g, -delay)

    // 快速估算：如果全投殖民地，最终的殖民地终值 vs 全投基础的终值
    // 假设基础容量为 B_cap，殖民地容量无限

    // 全投基础情景：基础会按逻辑斯蒂增长至饱和，殖民地无增长
    // 基础终值 ≈ min(B_cap, B_t * (1+g)^R) （粗略，实际有饱和）
    const baseCap = constants.baseCapacity ?? Infinity
    const baseOnlyFinal = Math.min(
      baseCap,
      state.baseProductivity * Math.pow(1 + g, remaining * baseSat),
    )

    // 全投殖民地情景：基础完全不增长（或仅自然衰减？这里假设基础不变，因为无投资）
    // 殖民地获得全部基础产出，且延迟后开始复利增长
    // 殖民地终值 ≈ C_t * (1+g)^R + sum_{t=0}^{R-delay} (B_t * g / cost) * (1+g)^{R-delay-t}
    // 简化：假设基础存量保持不变为 B_0，则殖民地终值 ≈ C_t*(1+g)^R + B_0 * (1+g)^{R-delay} * (1 - (1+g)^{-(R-delay+1)})/g * (g/cost)
    // 实际上可以更简单：比较单位投资的边际终值

    // 计算一单位当前基础产出分别投入两部门的终值贡献（粗略估计）
    // 投入基础：贡献 = g * baseSat * (1 - (1+g)^{-R * baseSat}) / (1 - (1+g)^{-baseSat})? 太复杂
    // 我们使用更直接的判断：如果剩余时间足够长，殖民地复利将碾压基础饱和收益
    const effectiveRemaining = Math.max(0, remaining - delay)
    const colonyGrowthFactor = Math.pow(1 + g, effectiveRemaining)
    const baseMaxPotential = baseCap - state.baseProductivity // 最多还能增长多少

    // 临界判断：殖民地单位投资的终值 ≈ (g / cost) * colonyGrowthFactor
    // 基础单位投资的终值 ≈ g * baseSat * (有限增长，最终受容量限制)
    // 当殖民地单位终值 > 基础可能的最大终值贡献时，all-in 殖民地最优
    const marginalColonyValue = (g / cost) * colonyGrowthFactor
    const marginalBaseValue = g * baseSat // 单期边际，但终值受饱和限制，这里用单期边际比较已足够

    // 更精确的比较：如果 colonyGrowthFactor / cost > 1 / baseSat，则殖民地边际更高
    if (
      effectiveRemaining > 0 &&
      marginalColonyValue > marginalBaseValue * baseCap
    ) {
      // All-in 殖民地
      return {
        baseInvestment: 0,
        colonyInvestment: state.baseProductivity,
      }
    }

    // 否则，可能处于末期，殖民地复利时间不足，采用常数比例
    const attractiveness = delayDiscount / cost
    const estimatedBaseSat = 1 / (1 + attractiveness)
    const kStar = attractiveness / (estimatedBaseSat + attractiveness)
    return porportionalColonize(kStar)(state, constants, currentGeneration)
  } else {
    // 模式二：殖民地有容量上限 → 两部门最终都将饱和，需要使用动态影子价格比较

    // 计算基础的影子价格：对未来基础增长潜力的积分
    // 基础饱和因子随 B 增加而下降，我们近似认为未来 B 按 logistic 曲线演化，
    // 因此剩余的“有效增长当量”正比于当前饱和因子乘以剩余时间的一个折扣函数。
    // 简化的影子价格正比于：baseSat * (1 - exp(-g * remaining * baseSat))
    // 但更稳健的做法是直接使用剩余时间内饱和因子的平均期望。
    const lambdaBase = (baseSat * (1 - Math.exp(-g * remaining * baseSat))) / g

    // 殖民地影子价格：类似，但考虑成本和延迟
    // 延迟意味着殖民地投资要在 delay 期后才开始产生回报，因此有效剩余时间减少。
    const effectiveRemainingForColony = Math.max(
      0,
      remaining - constants.colonizationDelay,
    )
    const lambdaColony =
      (colonySat *
        (1 - Math.exp(-g * effectiveRemainingForColony * colonySat))) /
      g /
      constants.colonizationCost

    // 考虑延迟贴现（将未来的影子价值折现到当前决策时刻）
    // 注意：lambdaColony 已经是投资生效后的影子价格，需要折现 delay 期。
    const discount = Math.pow(1 + g, -constants.colonizationDelay)
    const marginalBase = lambdaBase * baseSat
    const marginalColony = lambdaColony * colonySat * discount

    // 投资比例使得两部门边际贡献相等
    const totalMarginal = marginalBase + marginalColony
    const k = totalMarginal > 0 ? marginalColony / totalMarginal : 0

    // 边界保护
    const safeK = Math.min(1, Math.max(0, k))

    return {
      baseInvestment: state.baseProductivity * (1 - safeK),
      colonyInvestment: state.baseProductivity * safeK,
    }
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
      state.baseProductivity + 0.001 // float precision
      || decision.baseInvestment < 0
      || decision.colonyInvestment < 0
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
