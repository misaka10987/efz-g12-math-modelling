import { GENERATION_GROWTH, porportionalColonize, type Strategy } from '.'

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
      ? Math.max(0, 1 - state.baseProductivity / constants.baseCapacity)
      : 1
  const colonySat =
    constants.colonyLogistic && constants.colonyCapacity
      ? Math.max(0, 1 - state.colonyProductivity / constants.colonyCapacity)
      : 1

  // 基础影子价格：剩余时间内基础饱和因子的积分近似
  const lambdaBase = (baseSat * (Math.exp(g * remaining) - 1)) / g

  // 殖民地影子价格：需要确保有效剩余时间非负
  const effectiveRemaining = Math.max(
    0,
    remaining - constants.colonizationDelay,
  )
  const lambdaColony =
    effectiveRemaining > 0
      ? (colonySat * (Math.exp(g * effectiveRemaining) - 1)) /
        g /
        constants.colonizationCost
      : 0 // 若没有有效时间，殖民地无价值

  // 边际价值增量计算
  const marginalBase = lambdaBase * baseSat
  const marginalColony =
    ((lambdaColony * colonySat) / constants.colonizationCost) *
    Math.pow(1 + g, -constants.colonizationDelay)

  // 防止分母为零或负数
  const totalMarginal = marginalBase + marginalColony
  let k = totalMarginal > 0 ? marginalColony / totalMarginal : 0

  // 裁剪到合法区间 [0, 1]
  k = Math.min(1, Math.max(0, k))

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
