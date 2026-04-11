import { Chart } from './Chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './shadcn-solid/Card'
import { evaluate, neverColonize, porportionalColonize } from '@/model/main'
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

export const Model = () => {
  const [baseLogisticGrowth, setBaseLogisticGrowth] = createSignal(true)
  const [colonyLogisticGrowth, setColonyLogisticGrowth] = createSignal(true)
  const [baseCapacity, setBaseCapacity] = createSignal(10)
  const [colonyCapacity, setColonyCapacity] = createSignal(5)
  const [generation, setGeneration] = createSignal(120)

  const neverColonizeResult = createMemo(() => {
    return evaluate(
      {
        colonizationPenalty: 5,
        baseCapacity: baseLogisticGrowth() ? baseCapacity() : undefined,
        colonyCapacity: colonyLogisticGrowth() ? colonyCapacity() : undefined,
      },
      neverColonize,
      generation(),
    )
  })

  const proportionalColonizeResult = createMemo(() => {
    return evaluate(
      {
        colonizationPenalty: 5,
        baseCapacity: baseLogisticGrowth() ? baseCapacity() : undefined,
        colonyCapacity: colonyLogisticGrowth() ? colonyCapacity() : undefined,
      },
      porportionalColonize(1 / 2),
      generation(),
    )
  })

  const data = createMemo(() => {
    return [
      {
        label: 'Never Colonize',
        data: neverColonizeResult().map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      },
      {
        label: 'Proportional Colonize',
        data: proportionalColonizeResult().map((state, index) => ({
          x: index,
          y: state.baseProductivity + state.colonyProductivity,
        })),
        borderWidth: 1,
      },
    ]
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
          <section class="m-2 mt-6 flex flex-col gap-4">
            <h2>Generic</h2>
            <div class="grid grid-cols-2 gap-8">
              <NumberField
                value={generation()}
                defaultValue={120}
                required
                minValue={1}
                // a very high value results in performance issues
                maxValue={1200}
                onChange={setGeneration}
              >
                <NumberFieldLabel>Simulate Generation</NumberFieldLabel>
                <NumberFieldGroup>
                  <NumberFieldDecrementTrigger aria-label="Decrement" />
                  <NumberFieldInput />
                  <NumberFieldIncrementTrigger aria-label="Increment" />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </section>
          <section class="m-2 mt-6 flex flex-col gap-4">
            <h2>Logistic Growth</h2>
            <div class="grid grid-cols-2 gap-8 ">
              <div class="flex flex-col gap-4">
                <Switch
                  class="flex items-center space-x-2"
                  checked={baseLogisticGrowth()}
                  onChange={setBaseLogisticGrowth}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Logistic Base Growth</SwitchLabel>
                </Switch>

                <NumberField
                  hidden={!baseLogisticGrowth()}
                  value={baseCapacity()}
                  defaultValue={1}
                  required
                  minValue={1}
                  onChange={setBaseCapacity}
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
                  checked={colonyLogisticGrowth()}
                  onChange={setColonyLogisticGrowth}
                >
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>Logistic Colony Growth</SwitchLabel>
                </Switch>

                <NumberField
                  hidden={!colonyLogisticGrowth()}
                  value={colonyCapacity()}
                  defaultValue={1}
                  required
                  minValue={1}
                  onChange={setColonyCapacity}
                >
                  <NumberFieldLabel>Capacity</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldDecrementTrigger aria-label="Decrement" />
                    <NumberFieldInput />
                    <NumberFieldIncrementTrigger aria-label="Increment" />
                  </NumberFieldGroup>
                </NumberField>
              </div>
            </div>
          </section>
        </details>
      </CardFooter>
    </Card>
  )
}
