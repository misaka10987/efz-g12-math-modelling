import { Chart } from './Chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './shadcn-solid/Card'
import {
  differentialGreedyColonize,
  evaluate,
  neverColonize,
  pieceWiseColonise,
  porportionalColonize,
  type Constants,
} from '@/model/main'
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from './solid-ui/Switch'
import { createMemo, createSignal } from 'solid-js'
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from './shadcn-solid/numberfield'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './shadcn-solid/tabs'
import type { ChartDataset } from 'chart.js'
import {
  Slider,
  SliderFill,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from './solid-ui/slider'
import debounce from 'debounce'

const ConfigSection = (props: { title: string; children?: any }) => {
  return (
    <section class="m-2 mt-6 flex flex-col gap-4">
      <h2>{props.title}</h2>
      <div class="grid grid-cols-2 gap-8">{props.children}</div>
    </section>
  )
}

export const Model = () => {
  const [constants, setConstants] = createSignal<Constants>({
    colonizationCost: 5,
    colonizationDelay: 1,
    baseLogistic: true,
    baseCapacity: 10,
    colonyLogistic: true,
    colonyCapacity: 5,
  })

  const [generation, setGeneration] = createSignal(120)

  const [neverColonizeEnabled, setNeverColonizeEnabled] = createSignal(true)

  const [proportionalColonizeEnabled, setProportionalColonizeEnabled] =
    createSignal(false)

  const [proportion, setProportion] = createSignal(1 / 2)
  const [proportionSlider, setProportionSlider] = createSignal(proportion())
  const handleProportionChange = debounce(setProportion, 100)

  const [pieceWiseColoniseEnabled, setPieceWiseColoniseEnabled] =
    createSignal(false)

  const [
    differentialGreedyColonizeEnabled,
    setDifferentialGreedyColonizeEnabled,
  ] = createSignal(false)

  const neverColonizeResult = createMemo(() => {
    return evaluate(constants(), neverColonize, generation())
  })

  const proportionalColonizeResult = createMemo(() => {
    return evaluate(
      constants(),
      porportionalColonize(proportion()),
      generation(),
    )
  })

  const data = createMemo(() => {
    const piecewiseColonizeResult = evaluate(
      constants(),
      pieceWiseColonise(1 / 2, 1 / 2),
      generation(),
    )

    const data: ChartDataset[] = []

    if (neverColonizeEnabled()) {
      data.push({
        label: 'Never Colonize',
        data: neverColonizeResult().map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      })
    }

    if (proportionalColonizeEnabled()) {
      data.push({
        label: 'Proportional',
        data: proportionalColonizeResult().map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      })
    }

    if (pieceWiseColoniseEnabled()) {
      data.push({
        label: 'Piecewise',
        data: piecewiseColonizeResult.map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      })
    }

    if (differentialGreedyColonizeEnabled()) {
      data.push({
        label: 'Greedy Differential',
        data: evaluate(
          constants(),
          differentialGreedyColonize,
          generation(),
        ).map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      })
    }

    return data
  })

  return (
    <Card class="w-2xl max-w-[90vw]" slot="preview">
      <CardHeader>
        <CardTitle>Model</CardTitle>
        <CardDescription>Generation = 1/12 of Doubling Period</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <Chart data={data()} />
      </CardContent>
      <CardFooter>
        <details class="w-full">
          <summary class="font-semibold">Parameters</summary>
          <Tabs defaultValue="constants" class="w-full mt-6">
            <TabsList>
              <TabsTrigger class="data-selected:bg-accent" value="constants">
                Constants
              </TabsTrigger>
              <TabsTrigger class="data-selected:bg-accent" value="strategies">
                Strategies
              </TabsTrigger>
            </TabsList>
            <TabsContent value="constants">
              <ConfigSection title="Generic">
                <NumberField
                  value={generation()}
                  defaultValue={120}
                  required
                  minValue={1}
                  // a very high value results in performance issues
                  maxValue={1200}
                  onChange={(x) => setGeneration(parseFloat(x))}
                >
                  <NumberFieldLabel>Simulate Generation</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldDecrementTrigger aria-label="Decrement" />
                    <NumberFieldInput />
                    <NumberFieldIncrementTrigger aria-label="Increment" />
                  </NumberFieldGroup>
                </NumberField>
              </ConfigSection>
              <ConfigSection title="Logistic Growth">
                <div class="flex flex-col gap-4">
                  <Switch
                    class="flex items-center space-x-2"
                    checked={constants().baseLogistic}
                    onChange={(x) => {
                      setConstants((c) => ({ ...c, baseLogistic: x }))
                    }}
                  >
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                    <SwitchLabel>Logistic Base Growth</SwitchLabel>
                  </Switch>

                  <NumberField
                    hidden={!constants().baseLogistic}
                    value={constants().baseCapacity}
                    defaultValue={1}
                    required
                    minValue={1}
                    onChange={(x) =>
                      setConstants((c) => ({
                        ...c,
                        baseCapacity: parseFloat(x),
                      }))
                    }
                  >
                    <NumberFieldLabel>Capacity</NumberFieldLabel>
                    <NumberFieldGroup>
                      <NumberFieldDecrementTrigger aria-label="Decrement" />
                      <NumberFieldInput />
                      <NumberFieldIncrementTrigger aria-label="Increment" />
                    </NumberFieldGroup>
                  </NumberField>
                </div>
                <div class="flex flex-col gap-4">
                  <Switch
                    class="flex items-center space-x-2"
                    checked={constants().colonyLogistic}
                    onChange={(x) => {
                      setConstants((c) => ({ ...c, colonyLogistic: x }))
                    }}
                  >
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                    <SwitchLabel>Logistic Colony Growth</SwitchLabel>
                  </Switch>

                  <NumberField
                    hidden={!constants().colonyLogistic}
                    value={constants().colonyCapacity}
                    defaultValue={1}
                    required
                    minValue={1}
                    onChange={(x) =>
                      setConstants((c) => ({
                        ...c,
                        colonyCapacity: parseFloat(x),
                      }))
                    }
                  >
                    <NumberFieldLabel>Capacity</NumberFieldLabel>
                    <NumberFieldGroup>
                      <NumberFieldDecrementTrigger aria-label="Decrement" />
                      <NumberFieldInput />
                      <NumberFieldIncrementTrigger aria-label="Increment" />
                    </NumberFieldGroup>
                  </NumberField>
                </div>
              </ConfigSection>
              <ConfigSection title="Colonization Penalty">
                <NumberField
                  value={constants().colonizationCost}
                  defaultValue={2}
                  required
                  minValue={1}
                  onChange={(x) =>
                    setConstants((c) => ({
                      ...c,
                      colonizationCost: parseFloat(x),
                    }))
                  }
                >
                  <NumberFieldLabel>Coefficient Cost</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldDecrementTrigger aria-label="Decrement" />
                    <NumberFieldInput />
                    <NumberFieldIncrementTrigger aria-label="Increment" />
                  </NumberFieldGroup>
                </NumberField>

                <NumberField
                  value={constants().colonizationDelay}
                  defaultValue={1}
                  required
                  minValue={0}
                  onChange={(x) =>
                    setConstants((c) => ({
                      ...c,
                      colonizationDelay: parseFloat(x),
                    }))
                  }
                >
                  <NumberFieldLabel>Delay</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldDecrementTrigger aria-label="Decrement" />
                    <NumberFieldInput />
                    <NumberFieldIncrementTrigger aria-label="Increment" />
                  </NumberFieldGroup>
                </NumberField>
              </ConfigSection>
            </TabsContent>
            <TabsContent value="strategies">
              <ConfigSection title="Never Colonize">
                <Switch
                  class="flex items-center space-x-2"
                  checked={neverColonizeEnabled()}
                  onChange={setNeverColonizeEnabled}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Enabled</SwitchLabel>
                </Switch>
              </ConfigSection>
              <ConfigSection title="Proportional">
                <Switch
                  class="flex items-center space-x-2"
                  checked={proportionalColonizeEnabled()}
                  onChange={setProportionalColonizeEnabled}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Enabled</SwitchLabel>
                </Switch>
                <Slider
                  hidden={!proportionalColonizeEnabled()}
                  minValue={0}
                  maxValue={1}
                  step={0.001}
                  value={[proportionSlider()]}
                  onChange={(x) => {
                    if (!isNaN(x[0])) {
                      setProportionSlider(x[0])
                      handleProportionChange(x[0])
                    }
                  }}
                  getValueLabel={(params) => `${params.values[0]}`}
                  class="space-y-3"
                >
                  <div class="flex w-full justify-between">
                    <SliderLabel>Colonize Proportion</SliderLabel>
                    <SliderValueLabel />
                  </div>
                  <SliderTrack>
                    <SliderFill class="bg-foreground" />
                    <SliderThumb class="border-muted-foreground bg-muted" />
                  </SliderTrack>
                </Slider>
              </ConfigSection>
              <ConfigSection title="Piecewise">
                <Switch
                  class="flex items-center space-x-2"
                  checked={pieceWiseColoniseEnabled()}
                  onChange={setPieceWiseColoniseEnabled}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Enabled</SwitchLabel>
                </Switch>
              </ConfigSection>
              <ConfigSection title="Greedy Differential Algorithm">
                <Switch
                  class="flex items-center space-x-2"
                  checked={differentialGreedyColonizeEnabled()}
                  onChange={setDifferentialGreedyColonizeEnabled}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Enabled</SwitchLabel>
                </Switch>
              </ConfigSection>
            </TabsContent>
          </Tabs>
        </details>
      </CardFooter>
    </Card>
  )
}
